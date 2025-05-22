export async function POST(req) {
    try {
      const { resume, job } = await req.json();
  
      const prompt = `
  Compare this resume to the job description and rate how well it matches.
  Resume:
  ${resume}
  
  Job Description:
  ${job}
  
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
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        }),
      });
  
      const data = await groqRes.json();
      const result = data?.choices?.[0]?.message?.content || "No response from model";
  
      return Response.json({ result });
    } catch (error) {
      console.error(" Groq API Error:", error);
      return Response.json({ error: "Something went wrong" }, { status: 500 });
    }
  }
  