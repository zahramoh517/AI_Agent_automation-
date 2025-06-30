# Uses PdfReade to get text from PDF

from pypdf import PdfReader

def extract_text_from_pdf(pdf_path):
    """
    Extracts all text from a PDF and returns it as a single string block.

    Parameters:
        pdf_path (str): Path to the PDF file.

    Returns:
        str: The concatenated text from all pages.
    """
    reader = PdfReader(pdf_path)
    full_text = ""

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:  # Check if text was extracted successfully
            full_text += page_text + "\n"

    return full_text