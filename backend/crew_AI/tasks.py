# backend/crew/tasks.py

from crewai import Task
from .agents import (
    resume_parser_agent,
    job_parser_agent,
    candidate_matcher_agent,
    jd_enhancer_agent,
    pipeline_orchestrator_agent,
    tracking_agent,
    voice_interpreter_agent,
    prompt_translator_agent,
    question_generator_agent,
    candidate_chatbot_agent
)

# Resume extraction
resume_extraction_task = Task(
    description="Extract raw text from the uploaded PDF or DOCX resume.",
    expected_output="Clean resume text",
    agent=resume_parser_agent
)

# Job description parsing
parse_job_description_task = Task(
    description="Parse the job description and extract required skills, experience, and qualifications.",
    expected_output="Structured summary of job expectations and requirements.",
    agent=job_parser_agent
)

# Candidate-job matching (combined logic task)
candidate_matching_task = Task(
    description="This will be overwritten in main_candidate_matcher.py",
    expected_output="Match score and explanation of compatibility.",
    agent=candidate_matcher_agent
)




# Job description enhancement
jd_enhancement_task = Task(
    description="Polish the job description to make it clearer, more inclusive, and aligned with what candidates value.",
    expected_output="Enhanced job description.",
    agent=jd_enhancer_agent
)

# Pipeline flow controller
pipeline_orchestration_task = Task(
    description="Route outputs from different agents to the correct next step in the pipeline.",
    expected_output="Routed task instructions and next steps.",
    agent=pipeline_orchestrator_agent
)

# Logging and tracking
tracking_task = Task(
    description="Log events, issues, and progress throughout the hiring pipeline.",
    expected_output="Event log and process timeline.",
    agent=tracking_agent
)

# Voice transcription
voice_transcription_task = Task(
    description="Transcribe voice audio into readable, structured text.",
    expected_output="Accurate transcribed text.",
    agent=voice_interpreter_agent
)

# Prompt translation
prompt_translation_task = Task(
    description="Take transcribed text and convert it into structured JSON instructions or intent.",
    expected_output="Structured JSON intent.",
    agent=prompt_translator_agent
)

# Question generation
question_generation_task = Task(
    description="Generate interview questions and a scoring rubric using the job description and intent.",
    expected_output="List of interview questions and a rubric.",
    agent=question_generator_agent
)

# Screening assessment
screening_task = Task(
    description="Use the candidate chat interaction to assess suitability and provide a screening summary.",
    expected_output="Screening assessment with pass/fail recommendation.",
    agent=candidate_chatbot_agent
)
