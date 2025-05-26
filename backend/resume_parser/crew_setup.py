from crewai import Agent, Task, Crew
from langchain.chat_models import ChatGroq
import os
from dotenv import load_dotenv

# Load .env file if you're using one
load_dotenv()

# Set up Groq LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama3-70b-8192"
)

# Define your Agents
parser_agent = Agent(
    role="Resume Parser",
    goal="Extract relevant sections like skills, education, and experience from resume text",
    backstory="Expert in analyzing and understanding resumes for structured data extraction.",
    llm=llm
)

ranker_agent = Agent(
    role="Resume Ranker",
    goal="Evaluate the quality of resumes and rank them based on criteria like skills match and experience",
    backstory="HR assistant trained to score resumes for fit based on job descriptions.",
    llm=llm
)

# Define your Tasks
parse_resume_task = Task(
    description="Extract key information from the provided resume text and return it in JSON format.",
    expected_output="JSON object with keys: name, email, phone, education, experience, skills",
    agent=parser_agent
)

rank_resume_task = Task(
    description="Given structured resume data and a job description, return a score from 1 to 100.",
    expected_output="Resume score: an integer between 1 and 100",
    agent=ranker_agent
)

# Create Crew
resume_crew = Crew(
    agents=[parser_agent, ranker_agent],
    tasks=[parse_resume_task, rank_resume_task],
    verbose=True
)
