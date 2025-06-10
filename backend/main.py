import json
from resume_parser.extractor import extract_text 
from resume_parser import parse_resume



def save_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)


# === Step 1: Extract and parse resume ===
resume_text = extract_text("/Users/amaansah/Documents/Download/Startup/Tubby_startup/AI_Agent_automation-/Ama___Ada_resume.pdf")
parsed_resume = parse_resume(resume_text)

print("Extracted Resume Text:\n", resume_text)
print("\nParsed Resume JSON:\n", parsed_resume)

save_json(parsed_resume, "parsed_resume.json")

# === Step 2: Job description for matching ===
job_description = """
We're hiring a backend engineer with 2+ years of experience in Python, REST APIs, and database design. 
Experience with cloud platforms like AWS is a plus.
"""
