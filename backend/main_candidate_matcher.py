import os
from dotenv import load_dotenv
from crewai import Crew
from crew_AI.tasks import candidate_matching_task

# Load env vars
load_dotenv()

# Simulated parsed resumes (replace with real ones later)
parsed_resumes = [
    {
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "phone_number": "555-1234",
        "skills": ["Python", "Machine Learning", "AWS"]
    },
    {
        "name": "Bob Singh",
        "email": "bob@example.com",
        "phone_number": "555-5678",
        "skills": ["SQL", "Power BI", "Data Visualization"]
    },
    {
        "name": "Charlie Kim",
        "email": "charlie@example.com",
        "phone_number": "555-9012",
        "skills": ["JavaScript", "React", "Node.js"]
    }
]

# Create a task for each resume
tasks = [candidate_matching_task(resume) for resume in parsed_resumes]

# Create Crew
crew = Crew(
    agents=[task.agent for task in tasks],
    tasks=tasks,
    verbose=True
)

# Run the crew
results = crew.kickoff()

# Print the results
SHOW_SUMMARY_RESULTS = True

if SHOW_SUMMARY_RESULTS:
    print("\n=== Clean Match Results Summary ===\n")

    candidate_idx = 0  # Index for parsed_resumes list

    for result in results:
        # If it's a list (e.g., multiple TaskOutputs), loop through it
        if isinstance(result, list):
            outputs = result
        else:
            outputs = [result]

        for output in outputs:
            # Skip non-TaskOutput objects or garbage entries
            if not hasattr(output, "raw") or not output.raw:
                continue

            name = parsed_resumes[candidate_idx]["name"] if candidate_idx < len(parsed_resumes) else f"Unknown {candidate_idx}"
            candidate_idx += 1

            print(f"📄 Candidate: {name}")
            print(output.raw.strip())
            print("-" * 60)

