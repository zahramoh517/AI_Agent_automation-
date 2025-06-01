import json
import os
from dotenv import load_dotenv
from crewai import Crew
from crew_AI.tasks import candidate_matching_task

# Load environment variables
load_dotenv()

# Simulate parsed resume from Ama
parsed_resume = {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone_number": "123-456-7890",
    "skills": ["Python", "REST APIs", "AWS"]
}

# Simulate job description from frontend
job_description = """
We're hiring a backend engineer with 2+ years of experience in Python, REST APIs, and database design. 
Experience with cloud platforms like AWS is a plus.
"""

# Create the matching task
task = candidate_matching_task(parsed_resume, job_description)

# Run the agent
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
