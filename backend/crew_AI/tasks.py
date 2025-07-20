# backend/crew_AI/tasks.py
import os
from dotenv import load_dotenv
from crewai import Task
from .agents import (
    resume_parser_agent,
    job_parser_agent,
    get_candidate_matcher_agent,
    pipeline_orchestrator_agent,
    tracking_agent,
    voice_interpreter_agent,
    prompt_translator_agent,
    question_agent,
    evaluator_agent,
    candidate_chatbot_agent
)

load_dotenv()

# 1) Resume extraction
resume_extraction_task = Task(
    description="Extract raw text from the uploaded PDF or DOCX resume.",
    expected_output="Clean resume text",
    agent=resume_parser_agent
)

# 2) Job description parsing
parse_job_description_task = Task(
    description="Parse the job description and extract required skills, experience, and qualifications.",
    expected_output="Structured summary of job expectations and requirements.",
    agent=job_parser_agent
)



# 3) Candidate-job matching (dynamic JD)
def candidate_matching_task(parsed_resume, job_description):
    matcher = get_candidate_matcher_agent()

    prompt = f"""
IMPORTANT: Do NOT output any reasoning, apologies, or commentary.
Respond **only** with exactly this format and nothing else:

---
Match Score: <number between 1 and 100>

Explanation:
<2-3 sentence explanation referencing relevant skills/experience>
---

Now evaluate this candidate.

Be sure to:
- Carefully check **all sections of the resume** (skills, experience, projects, and education) for matches to the job description.  
- Consider skills mentioned in **projects, developer tools, and technologies**, even if not in the primary experience section.  
- Highlight relevant matches and explain any major gaps.

RESUME:
Name: {parsed_resume.get('name', 'N/A')}
Contact: {parsed_resume.get('contact', {})}
Education: {parsed_resume.get('education', [])}
Experience: {parsed_resume.get('experience', [])}
Projects: {parsed_resume.get('projects', [])}
Skills: {parsed_resume.get('skills', {})}

JOB DESCRIPTION:
{job_description}
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
def generate_question_task(job_description, resume_text):
    return Task(
        description=(
            "Generate EXACTLY 5 technical interview questions based on the job description "
            "and resume. Each question must:\n"
            "1. Reference specific skills/experience from the resume\n"
            "2. Relate directly to the job requirements\n"
            "3. Be technical in nature\n"
            "4. Be numbered (1-5)\n"
            "5. End with a question mark\n\n"
            "Job Description:\n{job_description}\n\nResume:\n{resume_text}"
        ).format(job_description=job_description, resume_text=resume_text),
        expected_output="""1. [Specific technical question about candidate's experience]?
2. [Question about a required job skill]?
3. [Question combining resume experience and job needs]?
4. [Deep technical question about a relevant technology]?
5. [Question about implementing solutions from the job description]?""",
        agent=question_agent
    )
# 10) Queevaluate_answers_task
def evaluate_answers_task(answers):
    """Task to evaluate interview answers based on question relevance"""
    return Task(
        description=f"""
        CRITICAL INSTRUCTIONS:
        1. Evaluate EACH answer separately
        2. Use EXACTLY this format for each question:
        ----------------------------------------
        Score: X/10 (1=Poor, 10=Excellent)
        Evaluation:
        - Completeness: [1-5] 
        - Clarity: [1-5]
        - Specificity: [1-5]
        - Technical Accuracy: [1-5]
        Strengths:
        - [List specific strengths]
        Weaknesses:
        - [List specific weaknesses]
        ----------------------------------------
        3. After all questions, provide:
        Final Verdict: [Strong Hire/Hire/Weak Hire/No Hire]

        ANSWERS TO EVALUATE:
        {answers}
        """,
        expected_output="Structured evaluation following EXACT required format",
        agent=evaluator_agent()
    )


# 11) Candidate screening chat
screening_task = Task(
    description="Use the candidate chat interaction to assess suitability and provide a screening summary.",
    expected_output="Screening assessment with pass/fail recommendation.",
    agent=candidate_chatbot_agent
)

