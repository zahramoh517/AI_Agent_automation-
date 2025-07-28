import sys
import json
import re
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

# Parse the output to extract match score and explanation
def parse_match_output(output):
    # Extract match score
    score_match = re.search(r'Match Score:\s*(\d+)', output, re.IGNORECASE)
    match_score = score_match.group(1) if score_match else "0"
    
    # Extract explanation
    explanation_match = re.search(r'Explanation:\s*(.+?)(?:\n\n|$)', output, re.IGNORECASE | re.DOTALL)
    explanation = explanation_match.group(1).strip() if explanation_match else "No explanation provided"
    
    return {
        "match_score": match_score,
        "explanation": explanation
    }

# Parse the result
parsed_result = parse_match_output(match_result)

# Print clean JSON for Node.js
print(json.dumps(parsed_result))
