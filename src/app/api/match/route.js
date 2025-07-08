import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

export async function POST(req) {
  try {
    const body = await req.json();
    const { resume_filename, job_description } = body;

    if (!resume_filename || !job_description) {
      return Response.json(
        { error: "Missing resume filename or job description" },
        { status: 400 }
      );
    }

    // Path to parsed resume JSON
    const parsedResumePath = path.join(
      process.cwd(),
      "resumes_parsed", // ✅ fixed path
      `${resume_filename}_parsed.json`
    );

    // ✅ Check if parsed resume file exists
    try {
      await fs.access(parsedResumePath);
    } catch {
      return Response.json(
        { error: `Parsed resume file not found: ${parsedResumePath}` },
        { status: 404 }
      );
    }

    // Path to Python script
    const pythonScriptPath = path.join(process.cwd(), "backend", "run_matcher.py");

    // Escape quotes in job description
    const safeJobDescription = job_description.replace(/"/g, '\\"');

    const command = `python3 "${pythonScriptPath}" "${parsedResumePath}" "${safeJobDescription}"`;

    console.log("🚀 Running Python matcher...");
    const result = await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Python error:", stderr);
          reject(stderr);
        } else {
          console.log("✅ Python result:", stdout);
          resolve(stdout);
        }
      });
    });

    // ✅ Extract only JSON block from Python output
    const jsonStart = result.indexOf("{");
    const jsonEnd = result.lastIndexOf("}") + 1;
    const cleanJson = result.slice(jsonStart, jsonEnd);

    const matchResult = JSON.parse(cleanJson);

    return Response.json({ result: matchResult });

  } catch (err) {
    console.error("❌ API /api/match error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
