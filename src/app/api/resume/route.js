import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
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

    // Create resumes directory if it doesn't exist
    const resumesDir = join(process.cwd(), "parsed_resumes");
    try {
      await mkdir(resumesDir, { recursive: true });
      console.log("📁 API: Created parsed_resumes directory");
    } catch (error) {
      console.log("📁 API: parsed_resumes directory already exists");
    }

    // Save the uploaded file
    console.log("💾 API: Saving resume file...");
    const bytes = await resume.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const resumePath = join(resumesDir, resume.name);
    await writeFile(resumePath, buffer);
    console.log("✅ API: Resume file saved at:", resumePath);

    // Process resume using Python bridge
    console.log("🔍 API: Processing resume...");
    const bridgePath = join(process.cwd(), "backend", "resume_parser", "bridge.py");
    const parsedResume = JSON.parse(await runPythonScript(bridgePath, [resumePath]));
    console.log("✅ API: Resume processed successfully");

    // Save the parsed resume as JSON
    const jsonPath = join(resumesDir, `${resume.name.replace('.pdf', '')}_parsed.json`);
    console.log("💾 API: Saving parsed resume as JSON...");
    await writeFile(jsonPath, JSON.stringify(parsedResume, null, 2));
    console.log("✅ API: Parsed resume saved at:", jsonPath);

    console.log("📤 API: Sending response back to client");
    return NextResponse.json({ 
      success: true,
      message: "Resume parsed successfully",
      parsedResume 
    });

  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
} 