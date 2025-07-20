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

def get_candidate_matcher_agent():
    return Agent(
        role='Candidate Ranker',
        goal='Match resumes to job descriptions and rank candidates',
        backstory='You are the matchmaker who compares every resume to the job description and decides who fits best, like a super-brain recruiter.',
        allow_delegation=False,
        verbose=False,
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

question_agent = Agent(
    role="Role-Specific Interview Question Generator",
    goal="Create specific, challenging interview questions tailored to the job description and candidate background",
    backstory=(
        "You are a seasoned hiring expert with over 10 years of experience conducting interviews across technical and non-technical roles "
        "at top-tier companies. You're known for designing insightful questions that assess real-world capability and problem-solving skills."
    ),
    llm=llm,
    verbose=True,
    max_iter=3,
    memory=True,
)
def evaluator_agent():
    """Agent to evaluate answers based on relevance and depth, applicable to any role"""
    return Agent(
        role="Interview Answer Evaluator",
        goal="Provide strict, structured evaluations of candidate answers using the required format",
        backstory="A highly experienced interviewer with over a decade of cross-functional hiring expertise, skilled at assessing candidates in both technical and non-technical domains.",
        llm=llm,
        verbose=True,
        allow_delegation=False,
        constraints=[
            "MUST use the exact evaluation format provided",
            "Score answers strictly based on relevance, clarity, and depth",
            "Provide specific, actionable feedback",
            "Never deviate from the required output structure"
        ],
        examples=[{
            "input": "Question: How do you prioritize tasks when managing multiple projects?\nAnswer: I use a calendar.",
            "output": "Score: 5/10\nEvaluation:\n- Completeness: 3\n- Clarity: 6\n- Relevance: 5\nFeedback: The answer is too general. Explain your prioritization framework or tools used.\n..."
        }]
    )



candidate_chatbot_agent = Agent(
    role='Interactive Interviewer',
    goal='Conduct first-round screening via chat',
    backstory='You are the friendly interviewer who chats with top candidates to assess them before a human gets involved.',
    allow_delegation=False,
    verbose=True,
    llm=llm
)
