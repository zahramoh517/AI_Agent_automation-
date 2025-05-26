# Uses spaCy or LangChain to parse resumes

#import os

#from groq import Groq
#export GROQ_API_KEY=<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>

import spacy
import re
import json
nlp = spacy.load("en_core_web_sm")

def extract_contact_info(text):
    # Email regex
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    email = email_match.group(0) if email_match else None

    # Phone number regex (simple international + local format)
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', text)
    phone = phone_match.group(0) if phone_match else None

    # LinkedIn regex (match linkedin URLs)
    #linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[A-Za-z0-9_-]+', text)
    #linkedin = linkedin_match.group(0) if linkedin_match else None

    return email, phone #linkedin

def parse_resume(text):
    doc = nlp(text)
    email, phone = extract_contact_info(text)

    result = {
        "name": None,
        "email": email,
        "phone_number": phone,
        "skills": [],
        "experience": []
    }

    # Extract name as first PERSON entity
    for ent in doc.ents:
        if ent.label_ == "PERSON" and not result["name"]:
            result["name"] = ent.text

    # Extract skills from entities with relevant labels, skipping email and phone-like texts
    skill_labels = {"ORG", "PRODUCT", "WORK_OF_ART", "SKILL", "LANGUAGE"}  # Add 'LANGUAGE' for programming languages
    for ent in doc.ents:
        if ent.label_ in skill_labels:
            skill_text = ent.text.strip()
            # Filter out email or phone appearing as skills
            if "@" in skill_text or re.search(r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', skill_text):
                continue
            if skill_text not in result["skills"]:
                result["skills"].append(skill_text)
            
            # Experience extraction is complex; we can enhance this later by rule-based or ML methods
            # # For now (since it is a prototype), we can capture lines/paragraphs that mention roles or companies, or use section headings


    return result


def parse_cover_letter(text):
    doc = nlp(text)
    return {
        "intent_sentences": [sent.text for sent in doc.sents if "excited" in sent.text or "passion" in sent.text]
    }
