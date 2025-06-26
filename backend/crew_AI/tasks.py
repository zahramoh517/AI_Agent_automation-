# backend/crew_AI/tasks.py

from crewai import Task
from .agents import (
    resume_parser_agent,
    job_parser_agent,
    get_candidate_matcher_agent,
    jd_enhancer_agent,
    pipeline_orchestrator_agent,
    tracking_agent,
    voice_interpreter_agent,
    prompt_translator_agent,
    question_generator_agent,
    candidate_chatbot_agent
)

#Resume extraction
resume_extraction_task = Task(
    description="Extract raw text from the uploaded PDF or DOCX resume.",
    expected_output="Clean resume text",
    agent=resume_parser_agent
)

#Job description parsing
parse_job_description_task = Task(
    description="Parse the job description and extract required skills, experience, and qualifications.",
    expected_output="Structured summary of job expectations and requirements.",
    agent=job_parser_agent
)

#Candidate-job matching
def candidate_matching_task(parsed_resume):
    job_description = """
We're hiring a backend engineer with 2+ years of experience in Python, REST APIs, and database design.
Experience with cloud platforms like AWS is a plus.
"""

    # ← use the factory to get a fresh Agent each time
    matcher = get_candidate_matcher_agent()

    prompt = f"""
You are a highly skilled AI candidate-matching agent.

Here’s exactly how to output (including both opening **and** closing dashes):

---
Match Score: 75

Explanation:
This is just a format example.

---

Now do the same for this resume and job description:

---
Match Score: <number between 1 and 100>

Explanation:
<2-3 sentence explanation referencing relevant skills/experience>

---

RESUME:
Name: {parsed_resume['name']}
Email: {parsed_resume['email']}
Phone: {parsed_resume['phone_number']}
Skills: {', '.join(parsed_resume['skills'])}

JOB DESCRIPTION:
{job_description}

**Important:**
• Do NOT say anything else.  
• Do NOT prepend or append any apologies, commentary, or “Final Answer.”  
• Just return that dashed block.
""".strip()

    return Task(
        description=prompt,
        expected_output="""
---
Match Score: <number between 1 and 100>

Explanation:
<2-3 sentence explanation referencing relevant skills/experience>

---
""".strip(),
        agent=matcher
    )

# 4) JD enhancement
jd_enhancement_task = Task(
    description="Polish the job description to make it clearer, more inclusive, and aligned with what candidates value.",
    expected_output="Enhanced job description.",
    agent=jd_enhancer_agent
)

# 5) Pipeline orchestration
pipeline_orchestration_task = Task(
    description="Route outputs from different agents to the correct next step in the pipeline.",
    expected_output="Routed task instructions and next steps.",
    agent=pipeline_orchestrator_agent
)

# 6) Tracking
tracking_task = Task(
    description="Log events, issues, and progress throughout the hiring pipeline.",
    expected_output="Event log and process timeline.",
    agent=tracking_agent
)

# 7) Voice transcription
voice_transcription_task = Task(
    description="Transcribe voice audio into readable, structured text.",
    expected_output="Accurate transcribed text.",
    agent=voice_interpreter_agent
)

# 8) Prompt translation
prompt_translation_task = Task(
    description="Take transcribed text and convert it into structured JSON instructions or intent.",
    expected_output="Structured JSON intent.",
    agent=prompt_translator_agent
)

# 9) Question generation
question_generation_task = Task(
    description="Generate interview questions and a scoring rubric using the job description and intent.",
    expected_output="List of interview questions and a rubric.",
    agent=question_generator_agent
)

# 10) Candidate screening chat
screening_task = Task(
    description="Use the candidate chat interaction to assess suitability and provide a screening summary.",
    expected_output="Screening assessment with pass/fail recommendation.",
    agent=candidate_chatbot_agent
)
