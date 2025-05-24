# Uses PyMuPDF to get text from PDF
# an improve,ent we can do is to handle scanned/image pdf using (OCR)

import fitz  # PyMuPDF
import re

def extract_text(filename):
    try:
        doc = fitz.open(filename)
    except Exception as e:
        print(f"[ERROR] Failed to open {filename}: {e}")
        return ""

    text_content = []
    previous_block_id = -1  # Initialize to an invalid block id

    for page in doc:
        blocks = page.get_text("blocks")
        for block in blocks:
            if block[6] == 0:  # Only process text blocks
                block_id = block[5]
                if previous_block_id != block_id:
                    text_content.append("\n")
                text_content.append(block[4])
                previous_block_id = block_id

    doc.close()

    # Normalize whitespace and return text
    return re.sub(r'\n\s*\n', '\n\n', "".join(text_content).strip())

'''
if __name__ == "__main__":
    filepath = "/Users/amaansah/Documents/Download/Startup/Tubby_startup/AI_Agent_automation-/Ama___Ada_resume.pdf"  # Replace with your PDF file path
    extracted_text = extract_text(filepath)
    print(extracted_text)
'''