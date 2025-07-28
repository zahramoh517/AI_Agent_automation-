import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

// Function to sleep for a given number of milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to check if error is a rate limit error
const isRateLimitError = (error) => {
  return error.includes("Rate limit reached") || 
         error.includes("rate_limit_exceeded") || 
         error.includes("429") ||
         error.includes("Too Many Requests");
};

// Function to extract wait time from error message
const extractWaitTime = (error) => {
  const match = error.match(/try again in (\d+\.?\d*)s/);
  return match ? parseFloat(match[1]) * 1000 : 5000; // Default to 5 seconds
};

// Function to retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      if (isRateLimitError(error)) {
        const waitTime = extractWaitTime(error);
        console.log(`⏳ Rate limit hit, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries + 1}`);
        await sleep(waitTime);
      } else {
        // For non-rate-limit errors, use exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️ Error occurred, waiting ${delay}ms before retry ${attempt + 1}/${maxRetries + 1}`);
        await sleep(delay);
      }
    }
  }
};

// Function to process matching in smaller batches
async function processMatchingBatch(resume_filenames, job_description, batch_folder, batchSize = 10) {
  const results = [];
  const errors = [];

  // Process resumes in smaller batches
  for (let i = 0; i < resume_filenames.length; i += batchSize) {
    const batchResumes = resume_filenames.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(resume_filenames.length / batchSize);
    
    console.log(`🔄 API: Matching batch ${batchNumber}/${totalBatches} (${batchResumes.length} resumes)`);

    // Process each resume in the current batch
    for (let j = 0; j < batchResumes.length; j++) {
      const resume_filename = batchResumes[j];
      const globalIndex = i + j;
      console.log(`🔄 API: Matching resume ${globalIndex + 1}/${resume_filenames.length}: ${resume_filename}`);

      try {
        // Path to parsed resume JSON (with batch folder if provided)
        const parsedResumePath = batch_folder 
          ? path.join(process.cwd(), "resumes_parsed", batch_folder, `${resume_filename}_parsed.json`)
          : path.join(process.cwd(), "resumes_parsed", `${resume_filename}_parsed.json`);

        // Check if parsed resume file exists
        try {
          await fs.access(parsedResumePath);
        } catch {
          throw new Error(`Parsed resume file not found: ${parsedResumePath}`);
        }

        // Path to Python script
        const pythonScriptPath = path.join(process.cwd(), "backend", "run_matcher.py");

        // Escape quotes in job description
        const safeJobDescription = job_description.replace(/"/g, '\\"');

        const command = `python3 "${pythonScriptPath}" "${parsedResumePath}" "${safeJobDescription}"`;

        // Retry logic for the Python matcher
        const result = await retryWithBackoff(async () => {
          console.log(`🚀 Running Python matcher for ${resume_filename}...`);
          return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
              if (error) {
                console.error(`❌ Python error for ${resume_filename}:`, stderr);
                reject(stderr);
              } else {
                console.log(`✅ Python result for ${resume_filename}:`, stdout);
                resolve(stdout);
              }
            });
          });
        });

        // Extract only JSON block from Python output
        const jsonStart = result.indexOf("{");
        const jsonEnd = result.lastIndexOf("}") + 1;
        const cleanJson = result.slice(jsonStart, jsonEnd);

        const matchResult = JSON.parse(cleanJson);

        // Add candidate name from parsed resume if available
        let candidateName = resume_filename;
        try {
          const parsedResumeData = JSON.parse(await fs.readFile(parsedResumePath, 'utf8'));
          if (parsedResumeData.name) {
            candidateName = parsedResumeData.name;
          }
        } catch (parseError) {
          console.log(`⚠️ Could not extract name from ${resume_filename}, using filename`);
        }

        results.push({
          filename: resume_filename,
          candidate_name: candidateName,
          match_score: matchResult.match_score,
          explanation: matchResult.explanation || "No explanation provided",
          batch_folder: batch_folder || null
        });

        console.log(`✅ API: Successfully matched ${resume_filename}`);

        // Small delay between individual resumes within a batch
        if (j < batchResumes.length - 1) {
          await sleep(1000); // 1 second between resumes in same batch
        }

      } catch (error) {
        console.error(`❌ API Error matching ${resume_filename}:`, error);
        errors.push({
          filename: resume_filename,
          error: error.message,
          batch_folder: batch_folder || null
        });
      }
    }
    
    // Longer delay between batches to prevent rate limits
    if (i + batchSize < resume_filenames.length) {
      const delay = resume_filenames.length > 20 ? 5000 : 3000; // 5s for large batches, 3s for smaller
      console.log(`⏳ API: Matching batch ${batchNumber} complete. Waiting ${delay}ms before next batch...`);
      await sleep(delay);
    }
  }
  
  return { results, errors };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { resume_filenames, job_description, batch_folder } = body;

    if (!resume_filenames || !resume_filenames.length || !job_description) {
      return Response.json(
        { error: "Missing resume filenames or job description" },
        { status: 400 }
      );
    }

    console.log(`🚀 API: Starting batch matching for ${resume_filenames.length} resumes`);
    if (batch_folder) {
      console.log(`📁 API: Processing batch folder: ${batch_folder}`);
    }

    // Determine batch size based on total number of resumes
    const batchSize = resume_filenames.length > 50 ? 8 : resume_filenames.length > 20 ? 10 : 15;
    console.log(`📊 API: Using batch size of ${batchSize} for ${resume_filenames.length} resumes`);

    // Process matching in batches
    const { results, errors } = await processMatchingBatch(
      resume_filenames, 
      job_description, 
      batch_folder, 
      batchSize
    );

    const successfulCount = results.length;
    const failedCount = errors.length;

    console.log(`📊 API: Batch matching complete. Success: ${successfulCount}, Failed: ${failedCount}`);

    if (successfulCount === 0) {
      return Response.json(
        { error: "All resumes failed to match" },
        { status: 500 }
      );
    }

    return Response.json({ 
      success: true,
      message: `Successfully matched ${successfulCount} out of ${resume_filenames.length} resumes`,
      results,
      errors,
      batch_folder: batch_folder || null,
      batchSize: batchSize,
      stats: {
        total: resume_filenames.length,
        successful: successfulCount,
        failed: failedCount,
        batches: Math.ceil(resume_filenames.length / batchSize)
      }
    });

  } catch (err) {
    console.error("❌ API /api/match/batch error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
} 