import sys
import json
from parser import parse_resume_with_groq
from extractor import extract_text_from_pdf

def main():
    if len(sys.argv) != 2:
        print("Usage: python bridge.py <pdf_path>", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Extract text using existing extractor
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print("Error: Failed to extract text from PDF", file=sys.stderr)
        sys.exit(1)
    
    # Parse resume using existing parser
    result = parse_resume_with_groq(text)
    
    # Output JSON result (result is already a JSON string from Groq)
    print(result)

if __name__ == "__main__":
    main() 