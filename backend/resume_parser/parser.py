# Uses groq or LangChain to parse resumes

import os
from groq import Groq
from dotenv import load_dotenv
from extractor import extract_text_from_pdf

def parse_resume_with_groq(text: str) -> dict:
    """
    Sends resume text to Groq's LLM and returns a structured JSON representation.

    Parameters:
        text (str): The raw text content of the resume.

    Returns:
        dict: Parsed resume fields in structured JSON format.
    """
    # Load environment variables
    load_dotenv()

    # Get API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables.")

    # Initialize Groq client
    client = Groq(api_key=api_key)

    # Prepare the prompt
    prompt = f"""You are an expert resume parser. I will provide you with the raw text of a resume.
    Your task is to return a structured JSON object representing the resume. The JSON should include the following fields if available:
    - name
    - contact (with email, phone, LinkedIn, GitHub, website, and location)
    - summary
    - education
    - experience
    - projects
    - skills (categorized if possible)
    - certifications
    - awards
    - volunteering

    Keep the format clean and consistent. Do not generate information that isn’t present in the input and do not include any other text, quotation marks or comments.

    Here is the resume:
    {text}
    """

    # Send the request
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()

# TESTING
'''
path ="/Users/amaansah/Documents/Download/Startup/AI_Agent_automation-/resumes_uploaded/Ama__ICT_Resume.pdf"
text = extract_text_from_pdf(path)

response = parse_resume_with_groq(text)


with open("resume_output.json", "w") as f:
    f.write(response)
    print("Resume output saved to resume_output.json")
#print(response.choices[0].message.content)
'''