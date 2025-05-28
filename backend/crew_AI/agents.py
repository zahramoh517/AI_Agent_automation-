# crew_AI/agents.py
import os
from dotenv import load_dotenv
from crewai import Agent, LLM

# Load environment variables
load_dotenv()

from crewai import LLM
llm = LLM(
    model="groq/llama3-70b-8192",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.2,
    max_tokens=500
)


resume_parser_agent = Agent(
    role='Resume Intake Agent',
    goal='Extract raw text from uploaded documents',
    backstory='You are the digital clerk who carefully reads every resume — PDF or DOCX — and hands over the clean text to the rest of the team.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

job_parser_agent = Agent(
    role='Job Description Parser',
    goal='Extract relevant skills and requirements from job descriptions',
    backstory='You are an expert in understanding job descriptions and extracting key expectations.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

candidate_matcher_agent = Agent(
    role='Candidate Ranker',
    goal='Match resumes to job descriptions and rank candidates',
    backstory='You are the matchmaker who compares every resume to the job description and decides who fits best, like a superbrain recruiter.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

pipeline_orchestrator_agent = Agent(
    role='Flow Controller',
    goal='Route outputs to next steps',
    backstory='You are the project manager behind the scenes — watching everything and making sure outputs go where they need to.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

tracking_agent = Agent(
    role='Status Tracker',
    goal='Log events and monitor progress',
    backstory='You keep the records. You log events, flag issues, and maintain a timeline of everything that happens.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

jd_enhancer_agent = Agent(
    role='JD Rewriter',
    goal='Improve job description clarity and appeal',
    backstory='You are the editor. You polish the JD — remove jargon, make it inclusive, and align it with what candidates care about.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

voice_interpreter_agent = Agent(
    role='Audio Transcriber',
    goal='Convert voice to accurate text',
    backstory='You listen closely. Whether it’s a recruiter’s voice note or a hiring manager’s comment, you transcribe every word into clean, readable text.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

prompt_translator_agent = Agent(
    role='Prompt Structurer',
    goal='Turn transcribed text into structured JSON',
    backstory='You are the mapper. After the Listener transcribes a voice, you make sense of it and turn it into structured instructions — like JSON blueprints.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

question_generator_agent = Agent(
    role='Question Builder',
    goal='Generate interview questions and rubric',
    backstory='You take the JD and intent and build smart, targeted questions — like a curriculum designer planning the perfect interview.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)

candidate_chatbot_agent = Agent(
    role='Interactive Interviewer',
    goal='Conduct first-round screening via chat',
    backstory='You are the friendly interviewer who chats with top candidates to assess them before a human gets involved.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)
