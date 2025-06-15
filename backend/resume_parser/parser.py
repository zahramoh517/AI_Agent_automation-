# Uses spaCy or LangChain to parse resumes

#import os

#from groq import Groq


import spacy
import re
import json
nlp = spacy.load("en_core_web_sm")

def extract_contact_info(text):
    email = None
    phone = None
    location = None
    linkedin = None
    
    # Extract email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        email = email_match.group(0)
    
    # Extract phone number (various formats)
    phone_patterns = [
        r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}',  # Standard US format
        r'\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',  # International format
        r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}'  # (XXX) XXX-XXXX format
    ]
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            phone = phone_match.group(0)
            break
    
    # Extract location (city, state format)
    location_patterns = [
        r'([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z]{2})',  # City, State
        r'([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z][a-z]+)',  # City, State (full name)
        r'([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*)'  # Just city
    ]
    for pattern in location_patterns:
        location_match = re.search(pattern, text)
        if location_match:
            location = location_match.group(0)
            break
    
    # Extract LinkedIn URL
    linkedin_patterns = [
        r'linkedin\.com/in/[\w-]+',
        r'linkedin\.com/profile/view\?id=[\w-]+',
        r'linkedin\.com/pub/[\w-]+'
    ]
    for pattern in linkedin_patterns:
        linkedin_match = re.search(pattern, text)
        if linkedin_match:
            linkedin = 'https://' + linkedin_match.group(0)
            break
    
    return {
        "email": email,
        "phone_number": phone,
        "location": location,
        "linkedin": linkedin
    }

def extract_header(text):
    # Split text into lines
    lines = text.split('\n')
    header_info = {
        "name": None,
        "email": None,
        "phone_number": None,
        "location": None,
        "linkedin": None
    }
    
    # Process each line
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', line)
        if email_match:
            header_info["email"] = email_match.group(0)
            continue
            
        # Check for phone
        phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}', line)
        if phone_match:
            header_info["phone_number"] = phone_match.group(0)
            continue
            
        # Check for LinkedIn
        linkedin_match = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[A-Za-z0-9_-]+', line)
        if linkedin_match:
            header_info["linkedin"] = linkedin_match.group(0)
            continue
            
        # If line doesn't contain contact info, it might be name or location
        if not any(header_info.values()):  # If we haven't found name yet
            header_info["name"] = line
        elif not header_info["location"]:  # If we haven't found location yet
            header_info["location"] = line
            
    return header_info

def extract_education(text):
    education = []
    # Common education keywords
    edu_keywords = r'(Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.|B\.E\.|M\.E\.|B\.Tech|M\.Tech|B\.Sc|M\.Sc)'
    
    # Split text into lines
    lines = text.split('\n')
    current_edu = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Look for degree
        if re.search(edu_keywords, line, re.IGNORECASE):
            if current_edu:
                education.append(current_edu)
            current_edu = {"degree": line}
        # Look for institution
        elif current_edu and ("university" in line.lower() or "college" in line.lower() or "institute" in line.lower()):
            current_edu["institution"] = line
        # Look for year
        elif current_edu and re.search(r'\d{4}', line):
            current_edu["year"] = line
        # Look for GPA
        elif current_edu and re.search(r'GPA|CGPA', line, re.IGNORECASE):
            current_edu["gpa"] = line
        # Look for relevant coursework
        elif current_edu and "coursework" in line.lower():
            if "coursework" not in current_edu:
                current_edu["coursework"] = []
            current_edu["coursework"].append(line)
    
    if current_edu:
        education.append(current_edu)
    
    return education

def extract_experience(text):
    experiences = []
    lines = text.split('\n')
    current_exp = None
    bullet_points = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Look for job titles
        if re.search(r'(Software Engineer|Developer|Programmer|Designer|Manager|Analyst|Consultant|Architect|Lead|Senior|Junior|Intern|Student|Research|Teaching|Assistant)', line, re.IGNORECASE):
            if current_exp:
                if bullet_points:
                    current_exp["responsibilities"] = bullet_points
                experiences.append(current_exp)
                bullet_points = []
            current_exp = {"title": line}
        # Look for company names
        elif current_exp and not current_exp.get("company"):
            # Skip if it's a date or location
            if not re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}', line, re.IGNORECASE) and \
               not re.search(r'([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z]{2})', line):
                current_exp["company"] = line
        # Look for dates
        elif current_exp and re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}', line, re.IGNORECASE):
            current_exp["date"] = line
        # Look for location
        elif current_exp and re.search(r'([A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*),\s*([A-Z]{2})', line):
            current_exp["location"] = line
        # Look for bullet points
        elif current_exp and (line.startswith('•') or line.startswith('-') or line.startswith('*')):
            bullet_points.append(line.lstrip('•-* '))
    
    if current_exp:
        if bullet_points:
            current_exp["responsibilities"] = bullet_points
        experiences.append(current_exp)
    
    return experiences

def extract_skills(text):
    skills = []
    # Common technical skills
    technical_skills = [
        # Programming Languages
        r'\b(Python|Java|JavaScript|TypeScript|C\+\+|C#|Ruby|PHP|Swift|Kotlin|Go|Rust)\b',
        # Web Technologies
        r'\b(HTML|CSS|React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|ASP\.NET)\b',
        # Databases
        r'\b(SQL|MySQL|PostgreSQL|MongoDB|Redis|Oracle|SQLite)\b',
        # Cloud & DevOps
        r'\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|CI/CD)\b',
        # Tools & Frameworks
        r'\b(Git|GitHub|JIRA|Confluence|Agile|Scrum|REST|GraphQL|Microservices)\b',
        # Data Science & ML
        r'\b(TensorFlow|PyTorch|Scikit-learn|Pandas|NumPy|Matplotlib|Jupyter)\b',
        # Mobile Development
        r'\b(Android|iOS|React Native|Flutter|Xamarin)\b',
        # Other Technologies
        r'\b(Linux|Unix|Windows|MacOS|Shell|Bash|PowerShell)\b'
    ]
    
    # Combine all patterns
    skill_pattern = '|'.join(technical_skills)
    
    # Find all matches
    matches = re.finditer(skill_pattern, text, re.IGNORECASE)
    for match in matches:
        skill = match.group(0)
        if skill not in skills:
            skills.append(skill)
    
    return skills

def parse_resume(text):
    # Split text into sections
    sections = {}
    current_section = None
    current_content = []
    
    for line in text.split('\n'):
        if line.startswith('=== ') and line.endswith(' ==='):
            if current_section and current_content:
                sections[current_section] = '\n'.join(current_content)
                current_content = []
            current_section = line[4:-4]
        elif current_section:
            current_content.append(line)
    
    if current_section and current_content:
        sections[current_section] = '\n'.join(current_content)
    
    # Extract information from each section
    result = {}
    
    # Process header section
    if 'HEADER' in sections:
        header_info = extract_contact_info(sections['HEADER'])
        result.update(header_info)
    
    # Process education section
    education_sections = ['EDUCATION', 'ACADEMIC BACKGROUND', 'ACADEMIC QUALIFICATIONS', 'EDUCATIONAL BACKGROUND']
    for section in education_sections:
        if section in sections:
            result['education'] = extract_education(sections[section])
            break
    
    # Process experience section
    experience_sections = ['EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT HISTORY', 'WORK HISTORY', 'RELEVANT EXPERIENCES', 'RELEVANT EXPERIENCE', 'PROFESSIONAL BACKGROUND']
    for section in experience_sections:
        if section in sections:
            result['experience'] = extract_experience(sections[section])
            break
    
    # Process skills section
    skills_sections = ['SKILLS', 'TECHNICAL SKILLS', 'CORE SKILLS', 'COMPETENCIES', 'TECHNICAL COMPETENCIES', 'PROFESSIONAL SKILLS']
    for section in skills_sections:
        if section in sections:
            result['skills'] = extract_skills(sections[section])
            break
    
    # Process projects section
    project_sections = ['PROJECTS', 'PERSONAL PROJECTS', 'ACADEMIC PROJECTS', 'PROJECT EXPERIENCE']
    for section in project_sections:
        if section in sections:
            result['projects'] = extract_projects(sections[section])
            break
    
    # Process certifications section
    if 'CERTIFICATIONS' in sections:
        result['certifications'] = extract_certifications(sections['CERTIFICATIONS'])
    
    # Process volunteer experience
    if 'VOLUNTEER EXPERIENCE' in sections:
        result['volunteer_experience'] = extract_experience(sections['VOLUNTEER EXPERIENCE'])
    
    # Process leadership experience
    if 'LEADERSHIP EXPERIENCE' in sections:
        result['leadership_experience'] = extract_experience(sections['LEADERSHIP EXPERIENCE'])
    
    return result

def extract_projects(text):
    projects = []
    lines = text.split('\n')
    current_project = None
    bullet_points = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Look for project titles (usually in title case or all caps)
        if re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$', line) or line.isupper():
            if current_project:
                if bullet_points:
                    current_project["description"] = bullet_points
                projects.append(current_project)
                bullet_points = []
            current_project = {"title": line}
        # Look for dates
        elif current_project and re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}', line, re.IGNORECASE):
            current_project["date"] = line
        # Look for technologies used
        elif current_project and re.search(r'(Technologies|Tools|Stack|Built with|Using):', line, re.IGNORECASE):
            current_project["technologies"] = line.split(':')[1].strip()
        # Look for bullet points
        elif current_project and (line.startswith('•') or line.startswith('-') or line.startswith('*')):
            bullet_points.append(line.lstrip('•-* '))
    
    if current_project:
        if bullet_points:
            current_project["description"] = bullet_points
        projects.append(current_project)
    
    return projects

def extract_certifications(text):
    certifications = []
    lines = text.split('\n')
    current_cert = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Look for certification names
        if re.search(r'(Certified|Certification|Certificate|License|Licensed)', line, re.IGNORECASE):
            if current_cert:
                certifications.append(current_cert)
            current_cert = {"name": line}
        # Look for dates
        elif current_cert and re.search(r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}', line, re.IGNORECASE):
            current_cert["date"] = line
        # Look for issuer
        elif current_cert and not current_cert.get("issuer"):
            current_cert["issuer"] = line
    
    if current_cert:
        certifications.append(current_cert)
    
    return certifications

def parse_cover_letter(text):
    doc = nlp(text)
    return {
        "intent_sentences": [sent.text for sent in doc.sents if "excited" in sent.text or "passion" in sent.text]
    }
