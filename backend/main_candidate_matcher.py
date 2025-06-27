import os
from dotenv import load_dotenv
from crewai import Crew
from crew_AI.tasks import candidate_matching_task

load_dotenv()

# 1) Dummy resumes
parsed_resumes = [
    {
        "name": "Morgan Chen",
        "email": "morgan.chen@example.com",
        "phone_number": "416-123-4567",
        "skills": ["Python", "Django", "PostgreSQL"],
    },
    {
        "name": "Riley Thompson",
        "email": "riley.thompson@example.com",
        "phone_number": "416-234-5678",
        "skills": ["Java", "Spring Boot", "Hibernate"],
    },
    {
        "name": "Sarah O'Brien",
        "email": "sarah.obrien@example.com",
        "phone_number": "416-345-6789",
        "skills": ["JavaScript", "Vue.js", "Tailwind CSS"],
    },
    {
        "name": "Carlos Ramirez",
        "email": "carlos.ramirez@example.com",
        "phone_number": "416-456-7890",
        "skills": ["Go", "Docker", "Kubernetes"],
    },
]

# 2) Create one matching Task per resume
tasks = [candidate_matching_task(resume) for resume in parsed_resumes]

# 3) Instantiate Crew and run — verbose=False to suppress internal reasoning
crew = Crew(
    agents=[t.agent for t in tasks],
    tasks=tasks,
    verbose=True
)

results = crew.kickoff()

# 4) Extract the Task outputs from kickoff events
final_outputs = []
for event, payload in results:
    if event == "tasks_output":
        final_outputs = payload
        break

# 5) Print a clean summary, grabbing the block from `.output`
print("\n=== Clean Match Results Summary ===\n")
for i, result_obj in enumerate(final_outputs):
    name = parsed_resumes[i]["name"]
    text = getattr(result_obj, "output", None) or str(result_obj)

    if '---' in text:
        block = text[text.find('---'):].strip()
        print(f"📄 Candidate: {name}\n{block}")
    else:
        print(f"📄 Candidate: {name}\n[⚠️ Couldn't find match block]\n{text}")
    print("-" * 60)
