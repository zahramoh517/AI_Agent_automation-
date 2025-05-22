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

  const handleSubmit = () => {
    // Mocking API response
    setRanking({
      score: 87,
      explanation: 'Matched keywords like React, Next.js, and Python. Missing team leadership experience.'
    });
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 space-y-6">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-semibold">AI Resume Ranker</h1>

          <label className="text-sm">Upload PDF Resume</label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
          />

          <label className="text-sm">Paste Job Description</label>
          <Textarea
            rows={5}
            placeholder="Enter the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <Button onClick={handleSubmit} disabled={!resume || !jobDescription}>
            Rank Resume
          </Button>

          {ranking && (
            <div className="mt-4 bg-gray-800 p-4 rounded-md">
              <p><strong>Score:</strong> {ranking.score}/100</p>
              <p><strong>Explanation:</strong> {ranking.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
