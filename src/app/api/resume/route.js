import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { extract_text } from "@/backend/resume_parser/extractor";
import { parse_resume } from "@/backend/resume_parser/parser";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!resume || !jobDescription) {
      return NextResponse.json(
        { error: "Resume and job description are required" },
        { status: 400 }
      );
    }

    // Save the uploaded file temporarily
    const bytes = await resume.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join("/tmp", resume.name);
    await writeFile(tempPath, buffer);

    // Extract and parse the resume
    const resumeText = extract_text(tempPath);
    const parsedResume = parse_resume(resumeText);

    // Compare with job description using Groq
    const prompt = `
Compare this resume to the job description and rate how well it matches.
Resume:
${JSON.stringify(parsedResume, null, 2)}

Job Description:
${jobDescription}

Return a score out of 100 and explain briefly why.
`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await groqRes.json();
    const result = data?.choices?.[0]?.message?.content || "No response from model";

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error processing resume:", error);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
} 