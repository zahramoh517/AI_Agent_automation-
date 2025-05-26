import json
from resume_parser.extractor import extract_text 
from resume_parser import parse_resume


def save_json(data, filename):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)


pdf_text = extract_text("/Users/amaansah/Documents/Download/Startup/Tubby_startup/AI_Agent_automation-/Ama___Ada_resume.pdf")
parsed_resume = parse_resume(pdf_text)

print(pdf_text)
print(parsed_resume)

save_json(parsed_resume, "parsed_resume.json")