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

    const results = [];
    const errors = [];

    // Process each resume with retry logic
    for (let i = 0; i < resume_filenames.length; i++) {
      const resume_filename = resume_filenames[i];
      console.log(`🔄 API: Matching resume ${i + 1}/${resume_filenames.length}: ${resume_filename}`);

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

        // Add a small delay between processing resumes to help prevent rate limits
        if (i < resume_filenames.length - 1) {
          console.log(`⏳ Adding delay between resume processing...`);
          await sleep(1000); // 1 second delay
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
      stats: {
        total: resume_filenames.length,
        successful: successfulCount,
        failed: failedCount
      }
    });

  } catch (err) {
    console.error("❌ API /api/match/batch error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
} 