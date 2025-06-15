'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUp } from "lucide-react";

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [ranking, setRanking] = useState<null | { score: number; explanation: string }>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!resume || !jobDescription) {
      setError('Please upload a resume and provide a job description');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.log('🚀 Starting resume processing...');
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/resume', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Received response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process resume');
      }

      // Display the parsed resume data
      setResult(data.parsedResume);

      // Get AI-based ranking
      const rankingResponse = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume: JSON.stringify(data.parsedResume),
          job: jobDescription
        })
      });

      const rankingData = await rankingResponse.json();
      
      if (!rankingResponse.ok) {
        throw new Error(rankingData.error || 'Failed to get ranking');
      }

      // Parse the AI response to extract score and explanation
      const matchResult = rankingData.result;
      const scoreMatch = matchResult.match(/Match Score:\s*(\d+)/);
      const explanationMatch = matchResult.match(/Explanation:\s*([\s\S]+)/);

      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      const explanation = explanationMatch ? explanationMatch[1].trim() : 'No explanation provided';

      setRanking({
        score,
        explanation
      });
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'An error occurred while processing the resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-6">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-semibold">AI Resume Ranker</h1>

          <div className="space-y-2">
            <label className="text-sm">Upload PDF Resume</label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e) => setResume(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm">Paste Job Description</label>
            <Textarea
              rows={5}
              placeholder="Enter the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!resume || !jobDescription || loading}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              "Rank Resume"
            )}
          </Button>

          {error && (
            <p className="text-red-500 text-center">{error}</p>
          )}

          {result && (
            <div className="mt-4 bg-gray-800 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Parsed Resume Data</h3>
              <pre className="whitespace-pre-wrap text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {ranking && (
            <div className="mt-4 bg-gray-800 p-4 rounded-md">
              <h3 className="font-semibold mb-2">Ranking Analysis</h3>
              <p><strong>Score:</strong> {ranking.score}/100</p>
              <p><strong>Explanation:</strong> {ranking.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
