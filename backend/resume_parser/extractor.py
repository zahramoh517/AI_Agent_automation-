# Uses PyMuPDF to get text from PDF
# an improve,ent we can do is to handle scanned/image pdf using (OCR)

import fitz  # PyMuPDF
import re

def is_section_header(text, block):
    # Common resume section headers
    section_patterns = [
        # Education variations
        r'^EDUCATION$',
        r'^ACADEMIC BACKGROUND$',
        r'^ACADEMIC QUALIFICATIONS$',
        r'^EDUCATIONAL BACKGROUND$',
        
        # Experience variations
        r'^EXPERIENCE$',
        r'^WORK EXPERIENCE$',
        r'^PROFESSIONAL EXPERIENCE$',
        r'^EMPLOYMENT HISTORY$',
        r'^WORK HISTORY$',
        r'^RELEVANT EXPERIENCES$',
        r'^RELEVANT EXPERIENCE$',
        r'^PROFESSIONAL BACKGROUND$',
        
        # Skills variations
        r'^SKILLS$',
        r'^TECHNICAL SKILLS$',
        r'^CORE SKILLS$',
        r'^COMPETENCIES$',
        r'^TECHNICAL COMPETENCIES$',
        r'^PROFESSIONAL SKILLS$',
        
        # Projects variations
        r'^PROJECTS$',
        r'^PERSONAL PROJECTS$',
        r'^ACADEMIC PROJECTS$',
        r'^PROJECT EXPERIENCE$',
        
        # Contact variations
        r'^CONTACT$',
        r'^CONTACT INFORMATION$',
        r'^CONTACT DETAILS$',
        r'^PERSONAL INFORMATION$',
        
        # Other common sections
        r'^CERTIFICATIONS$',
        r'^AWARDS$',
        r'^PUBLICATIONS$',
        r'^LANGUAGES$',
        r'^INTERESTS$',
        r'^REFERENCES$',
        r'^VOLUNTEER EXPERIENCE$',
        r'^LEADERSHIP EXPERIENCE$'
    ]
    
    # Check if text matches any section pattern
    for pattern in section_patterns:
        if re.match(pattern, text, re.IGNORECASE):
            return True
    
    # Check formatting characteristics
    is_all_caps = text.isupper()
    is_title_case = bool(re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$', text))
    is_short = len(text.split()) <= 3  # Section headers are typically 1-3 words
    
    # Check if it's likely a section header based on formatting
    if (is_all_caps or is_title_case) and is_short:
        # Additional check for common section keywords
        section_keywords = ['experience', 'education', 'skills', 'projects', 'contact', 'certification', 'award', 'publication', 'language', 'interest', 'reference', 'volunteer', 'leadership']
        return any(keyword in text.lower() for keyword in section_keywords)
    
    return False

def extract_text(filename):
    doc = fitz.open(filename)
    text = ""
    sections = {}
    current_section = None
    current_content = []
    
    # First pass: identify sections and their content
    for page in doc:
        blocks = page.get_text("blocks")
        for block in blocks:
            text = block[4].strip()
            if not text:
                continue
            
            # Check if this is a section header
            if is_section_header(text, block):
                # Save previous section content
                if current_section and current_content:
                    sections[current_section] = '\n'.join(current_content)
                    current_content = []
                current_section = text.upper()
            elif current_section:
                current_content.append(text)
            else:
                # If no section is identified yet, treat as header content
                if not current_section:
                    current_section = 'HEADER'
                current_content.append(text)
    
    # Save the last section
    if current_section and current_content:
        sections[current_section] = '\n'.join(current_content)
    
    # Format the output with clear section markers
    formatted_text = ""
    for section, content in sections.items():
        formatted_text += f"=== {section} ===\n{content}\n\n"
    
    # Clean up the text
    text = formatted_text.strip()
    
    # Remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove spaces before and after newlines
    text = re.sub(r' +\n', '\n', text)
    text = re.sub(r'\n +', '\n', text)
    
    # Ensure consistent spacing around section headers
    text = re.sub(r'\n([A-Z][A-Za-z\s]+)\n', r'\n\n\1\n\n', text)
    
    return text

if __name__ == "__main__":
    filepath = "/Users/amaansah/Documents/Download/Startup/Tubby_startup/AI_Agent_automation-/Ama___Ada_resume.pdf"
    extracted_text = extract_text(filepath)
    print(extracted_text)