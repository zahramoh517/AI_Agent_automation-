# AI Resume Ranker

An intelligent resume ranking system that uses AI to match candidates with job descriptions. Built with Next.js, Python, and Groq AI.

## Features

### Single Resume Processing
- Upload individual PDF resumes
- AI-powered parsing and extraction
- Match scoring against job descriptions
- Detailed explanations for matches

### Batch Resume Processing
- **Folder Drag & Drop**: Simply drag and drop a folder containing multiple PDF resumes
- **Multiple File Selection**: Select multiple PDF files individually
- **Organized Output**: Files are automatically organized into timestamped batch folders
- **Optimized Batch Processing**: Processes resumes in smaller chunks (8-15 per batch) to prevent rate limits
- **Smart Delays**: Longer delays between batches (3-5 seconds) for large quantities
- **Progress Persistence**: Saves progress to localStorage, survives browser refreshes
- **Rate Limit Protection**: Automatic retry logic with exponential backoff for API rate limits
- **Bulk Matching**: Process dozens of resumes simultaneously
- **Ranked Results**: View all candidates ranked by match score

## Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Groq API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AI_Agent_automation-
```

2. Install dependencies:
```bash
npm install
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your Groq API key to .env
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Single Resume Mode
1. Select "Single Resume" mode
2. Upload a PDF resume
3. Paste the job description
4. Click "Rank Resume" to get match score and explanation

### Batch Resume Mode
1. Select "Multiple Resumes" mode
2. Either:
   - **Drag and drop a folder** containing PDF resumes, or
   - **Select multiple PDF files** individually
3. Paste the job description
4. Click "Rank Resumes" to process all files
5. View ranked results in the table

### File Organization
When processing multiple resumes, files are automatically organized:

```
resumes_uploaded/
  └── batch_2024-01-15T10-30-45/
      ├── resume1.pdf
      ├── resume2.pdf
      └── ...

resumes_parsed/
  └── batch_2024-01-15T10-30-45/
      ├── resume1_parsed.json
      ├── resume2_parsed.json
      └── ...
```

## Architecture

- **Frontend**: Next.js with React, Tailwind CSS
- **Backend APIs**: Next.js API routes
- **AI Processing**: Python with CrewAI and Groq
- **File Storage**: Local file system with organized folders

## API Endpoints

- `POST /api/resume` - Process single resume
- `POST /api/resume/batch` - Process multiple resumes
- `POST /api/match` - Match single resume against job description
- `POST /api/match/batch` - Match multiple resumes against job description

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [CrewAI Documentation](https://docs.crewai.com/)
- [Groq AI](https://groq.com/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
