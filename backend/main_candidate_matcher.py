# backend/main_candidate_matcher.py
import os
from dotenv import load_dotenv
from crewai import Crew
from crew_AI.tasks import candidate_matching_task

load_dotenv()

# 1. Prepare your candidate data
parsed_resumes = [
    {"name": "Alice Johnson", "email": "alice@example.com", "phone_number": "555-1234", "skills": ["Python", "Machine Learning", "AWS"]},
    {"name": "Bob Singh",     "email": "bob@example.com",   "phone_number": "555-5678", "skills": ["SQL", "Power BI", "Data Visualization"]},
    {"name": "Charlie Kim",   "email": "charlie@example.com","phone_number": "555-9012", "skills": ["JavaScript", "React", "Node.js"]},
]

# 2. Create one matching task per resume
tasks = [candidate_matching_task(resume) for resume in parsed_resumes]

# 3. Instantiate Crew and run
crew = Crew(
    agents=[t.agent for t in tasks],
    tasks=tasks,
    verbose=True
)

results = crew.kickoff()

# 4. Print a clean summary
print("\n=== Clean Match Results Summary ===\n")

# extract task outputs
final_outputs = []
for item in results:
    if isinstance(item, tuple) and item[0] == "tasks_output":
        final_outputs = item[1]

# simplified parser: grab from first '---' to end
for i, output in enumerate(final_outputs):
    name = parsed_resumes[i]["name"]
    raw = getattr(output, "raw", "") or ""

    if '---' in raw:
        start = raw.find('---')
        block = raw[start:].strip()
        print(f"📄 Candidate: {name}\n{block}")
    else:
        print(f"📄 Candidate: {name}\n[⚠️ WARNING] Couldn't find a block:\n{raw.strip()}")
    print("-" * 60)
