import sys
import json
from crewai import Crew
from crew_AI.tasks import candidate_matching_task

# Get CLI arguments
parsed_resume_path = sys.argv[1]
job_description = sys.argv[2]

# Load parsed resume JSON
with open(parsed_resume_path, "r") as f:
    parsed_resume = json.load(f)

# Create CrewAI task for matching
task = candidate_matching_task(parsed_resume, job_description)
crew = Crew(agents=[task.agent], tasks=[task], verbose=False)

# Run the task
results = crew.kickoff()

# Extract Groq output
for event, payload in results:
    if event == "tasks_output":
        match_result = str(payload[0]).strip()
        break

# ✅ Print only clean JSON for Node.js
print(json.dumps({"match_score": match_result}))
