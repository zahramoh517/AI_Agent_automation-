import json
from resume_parser.extractor import extract_text 
from resume_parser import parse_resume
from resume_parser.crew_setup import resume_crew



def save_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)


resume_text = extract_text("/Users/amaansah/Documents/Download/Startup/Tubby_startup/AI_Agent_automation-/Ama___Ada_resume.pdf")
parsed_resume = parse_resume(resume_text)

print(resume_text)
print(parsed_resume)

save_json(parsed_resume, "parsed_resume.json")

#TESTING CREWAI
# Optional: Add a sample job description
job_description = """
We're hiring a backend engineer with 2+ years of experience in Python, REST APIs, and database design. 
Experience with cloud platforms like AWS is a plus.
"""

# Step 2: Run the CrewAI pipeline
if resume_text:
    result = resume_crew.kickoff(inputs={"input": resume_text + "\n\nJob Description:\n" + job_description})
    print("Result from CrewAI:")
    print(result)
else:
    print("No text extracted from resume.")