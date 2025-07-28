import { NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { spawn } from "child_process";

// Function to run Python script and get output
function runPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scriptPath, ...args]);
    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${error}`));
      } else {
        resolve(output.trim());
      }
    });
  });
}

// Function to ensure directory exists
async function ensureDirectoryExists(dirPath) {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

// Function to generate batch folder name
function generateBatchFolderName() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `batch_${timestamp}`;
}

export async function POST(req) {
  console.log("📥 API: Received batch resume processing request");
  try {
    const formData = await req.formData();
    const resumes = formData.getAll("resumes");
    const jobDescription = formData.get("jobDescription");

    console.log("📄 API: Number of resumes:", resumes.length);
    console.log("📝 API: Job description length:", jobDescription?.length || 0);

    if (!resumes || resumes.length === 0 || !jobDescription) {
      console.error("❌ API: Missing resumes or job description");
      return NextResponse.json(
        { error: "Resumes and job description are required" },
        { status: 400 }
      );
    }

    // Generate batch folder name
    const batchFolderName = generateBatchFolderName();
    
    // Ensure directories exist with batch subfolders
    const uploadedResumesDir = join(process.cwd(), "resumes_uploaded", batchFolderName);
    const parsedResumesDir = join(process.cwd(), "resumes_parsed", batchFolderName);
    
    await ensureDirectoryExists(uploadedResumesDir);
    await ensureDirectoryExists(parsedResumesDir);

    const processedResults = [];
    const parsedFilenames = [];

    // Process each resume
    for (let i = 0; i < resumes.length; i++) {
      const resume = resumes[i];
      console.log(`🔄 API: Processing resume ${i + 1}/${resumes.length}: ${resume.name}`);

      try {
        // Step 1: Save the uploaded file to resumes_uploaded/batch_folder
        console.log(`💾 API: Saving resume file ${resume.name} to ${batchFolderName}...`);
        const bytes = await resume.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadedResumePath = join(uploadedResumesDir, resume.name);
        await writeFile(uploadedResumePath, buffer);
        console.log(`✅ API: Resume file saved to ${uploadedResumePath}`);

        // Step 2: Process resume using Python bridge
        console.log(`🔍 API: Processing resume ${resume.name}...`);
        const bridgePath = join(process.cwd(), "backend", "resume_parser", "bridge.py");
        const parsedResume = JSON.parse(await runPythonScript(bridgePath, [uploadedResumePath]));
        console.log(`✅ API: Resume ${resume.name} processed successfully`);

        // Step 3: Save the parsed resume as JSON to resumes_parsed/batch_folder
        const jsonFilename = `${resume.name.replace('.pdf', '')}_parsed.json`;
        const jsonPath = join(parsedResumesDir, jsonFilename);
        console.log(`💾 API: Saving parsed resume as JSON to ${batchFolderName}...`);
        await writeFile(jsonPath, JSON.stringify(parsedResume, null, 2));
        console.log(`✅ API: Parsed resume saved at: ${jsonPath}`);

        // Add to results
        const parsedFilename = resume.name.replace('.pdf', '');
        parsedFilenames.push(parsedFilename);
        
        processedResults.push({
          originalName: resume.name,
          uploadedPath: uploadedResumePath,
          parsedPath: jsonPath,
          parsedFilename: parsedFilename,
          batchFolder: batchFolderName,
          success: true
        });

      } catch (error) {
        console.error(`❌ API Error processing ${resume.name}:`, error);
        processedResults.push({
          originalName: resume.name,
          batchFolder: batchFolderName,
          success: false,
          error: error.message
        });
      }
    }

    const successfulCount = processedResults.filter(r => r.success).length;
    const failedCount = processedResults.filter(r => !r.success).length;

    console.log(`📊 API: Batch processing complete. Success: ${successfulCount}, Failed: ${failedCount}`);
    console.log(`📁 API: Files organized in batch folder: ${batchFolderName}`);

    if (successfulCount === 0) {
      return NextResponse.json(
        { error: "All resumes failed to process" },
        { status: 500 }
      );
    }

    console.log("📤 API: Sending batch response back to client");
    return NextResponse.json({ 
      success: true,
      message: `Successfully processed ${successfulCount} out of ${resumes.length} resumes`,
      processedResults,
      parsedFilenames, // Only successful ones
      batchFolder: batchFolderName,
      stats: {
        total: resumes.length,
        successful: successfulCount,
        failed: failedCount
      }
    });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Failed to process batch resumes" },
      { status: 500 }
    );
  }
} 