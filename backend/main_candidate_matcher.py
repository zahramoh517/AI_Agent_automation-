import json
import os
from dotenv import load_dotenv
from crewai import Crew
from crew_AI.tasks import candidate_matching_task

# Load environment variables
load_dotenv()

# Load parsed resume
with open("/Users/malikasharma/Desktop/AI_Agent_automation-/parsed_resume.json", "r") as f:
    parsed_resume = json.load(f)

# Get the task from the reusable function
task = candidate_matching_task(parsed_resume)

# Run the Crew
crew = Crew(
    agents=[task.agent],
    tasks=[task],
    verbose=True
)

print("\n=== FINAL TASK PROMPT ===\n")
print(task.description)

result = crew.kickoff()

print("\n=== Match Result from Candidate Matcher Agent ===\n")
print(result)
