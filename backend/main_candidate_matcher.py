import json
import os
from dotenv import load_dotenv
from crewai import Crew
from crew_AI.agents import candidate_matcher_agent
from crew_AI.tasks import candidate_matching_task

# Load environment variables
load_dotenv()

# === Step 1: Load parsed resume from JSON file ===
with open("/Users/malikasharma/Desktop/AI_Agent_automation-/parsed_resume.json", "r") as f:
    parsed_resume = json.load(f)

# === Step 2: Define job description for matching ===
job_description = """
We're hiring a backend engineer with 2+ years of experience in Python, REST APIs, and database design. 
Experience with cloud platforms like AWS is a plus.
"""

# === Step 3: Add example output to improve LLM response quality ===
example = """
Example:

Match Score: 85

Explanation:
The candidate has strong experience with software engineering fundamentals, Node.js, and databases, which aligns well with the job description. However, there is no mention of Python or REST APIs, which are required, so the score is not higher.
"""

# === Step 4: Combine resume + JD into prompt ===
formatted_input = f"""
You are a highly skilled AI candidate-matching agent.

Your job is to analyze how well a candidate's resume matches a given job description.

Return your response in the following format:

---
Match Score: <number between 1 and 100>

Explanation:
<2-3 sentence explanation clearly referencing skills/experience that match or don’t match the job description.>
---

{example}

RESUME:
Name: {parsed_resume['name']}
Email: {parsed_resume['email']}
Phone: {parsed_resume['phone_number']}
Skills: {', '.join(parsed_resume['skills'])}

JOB DESCRIPTION:
{job_description}
"""

# === Step 5: Inject into task ===
candidate_matching_task.description = formatted_input
candidate_matching_task.expected_output = """
Match Score: <1-100>
Explanation: <2-3 clear sentences justifying score based on skills/experience>
"""

# === Step 6: Run Crew ===
crew = Crew(
    agents=[candidate_matcher_agent],
    tasks=[candidate_matching_task],
    verbose=True
)

result = crew.kickoff()
print("\n Match Result from Candidate Matcher Agent:\n")
print(result)
