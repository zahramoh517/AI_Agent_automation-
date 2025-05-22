# Uses PyMuPDF to get text from PDF
# an improve,ent we can do is to handle scanned/image pdf using (OCR)

import fitz  # PyMuPDF

def extract_text(filename):
    doc = fitz.open(filename)
    text_content = []

    for page in doc:
        blocks = page.get_text("blocks")
        previous_block_id = -1  # Initialize to an invalid block id

        for block in blocks:
            if block[6] == 0:  # Only process text blocks
                block_id = block[5]
                if previous_block_id != block_id:
                    text_content.append("\n")
                text_content.append(block[4])
                previous_block_id = block_id

    return "".join(text_content)


if __name__ == "__main__":
    filepath = "/Users/amaansah/Documents/Download/Startup/Tubby_startup/AI_Agent_automation-/Ama___Ada_resume.pdf"  # Replace with your PDF file path
    extracted_text = extract_text(filepath)
    print(extracted_text)