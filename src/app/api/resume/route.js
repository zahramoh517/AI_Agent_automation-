import { NextResponse } from "next/server";
import { writeFile, mkdir, copyFile, unlink, access } from "fs/promises";
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

export async function POST(req) {
  console.log("📥 API: Received resume processing request");
  try {
    const formData = await req.formData();
    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    console.log("📄 API: Resume file:", resume?.name);
    console.log("📝 API: Job description length:", jobDescription?.length || 0);

    if (!resume || !jobDescription) {
      console.error("❌ API: Missing resume or job description");
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    // Ensure both directories exist
    const uploadedResumesDir = join(process.cwd(), "resumes_uploaded");
    const parsedResumesDir = join(process.cwd(), "resumes_parsed");
    
    await ensureDirectoryExists(uploadedResumesDir);
    await ensureDirectoryExists(parsedResumesDir);

    // Step 1: Save the uploaded file to resumes_uploaded folder
    console.log("💾 API: Saving resume file to resumes_uploaded...");
    const bytes = await resume.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadedResumePath = join(uploadedResumesDir, resume.name);
    await writeFile(uploadedResumePath, buffer);
    console.log("✅ API: Resume file saved to resumes_uploaded at:", uploadedResumePath);

    // Step 2: Process resume using Python bridge
    console.log("🔍 API: Processing resume...");
    const bridgePath = join(process.cwd(), "backend", "resume_parser", "bridge.py");
    const parsedResume = JSON.parse(await runPythonScript(bridgePath, [uploadedResumePath]));
    console.log("✅ API: Resume processed successfully");

    // Step 3: Save the parsed resume as JSON to resumes_parsed folder
    const jsonPath = join(parsedResumesDir, `${resume.name.replace('.pdf', '')}_parsed.json`);
    console.log("💾 API: Saving parsed resume as JSON to resumes_parsed...");
    await writeFile(jsonPath, JSON.stringify(parsedResume, null, 2));
    console.log("✅ API: Parsed resume saved at:", jsonPath);

    console.log("📤 API: Sending response back to client");
    return NextResponse.json({ 
      success: true,
      message: "Resume parsed successfully",
      parsedResume,
      uploadedPath: uploadedResumePath,
      parsedPath: jsonPath
    });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
} 