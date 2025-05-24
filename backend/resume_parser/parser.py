# Uses spaCy or LangChain to parse resumes

import spacy


nlp = spacy.load("en_core_web_sm")

def parse_resume(text):
    doc = nlp(text)
    result = {
        "name": None,
        "email": None,
        "skills": [],
        "experience": []
    }

    for ent in doc.ents:
        if ent.label_ == "PERSON" and not result["name"]:
            result["name"] = ent.text
        elif ent.label_ == "EMAIL":
            result["email"] = ent.text
        elif ent.label_ in ["ORG", "WORK_OF_ART", "PRODUCT", "SKILL"]:
            result["skills"].append(ent.text)

    return result

def parse_job_description(text):
    doc = nlp(text)
    # You can extract keywords, required experience, etc.
    return {
        "required_skills": [token.text for token in doc if token.pos_ == "NOUN"]
    }

def parse_cover_letter(text):
    doc = nlp(text)
    return {
        "intent_sentences": [sent.text for sent in doc.sents if "excited" in sent.text or "passion" in sent.text]
    }
