"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  LayoutDashboard,
  BarChart2,
  Lightbulb,
  LifeBuoy,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react";

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [fileLocations, setFileLocations] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] text-gray-800 font-[Inter]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      setResume(file);
      setError("");
      setFileLocations(null);
      setMatchScore(null);
      setExplanation("");
    }
  };

  const handleSubmit = async () => {
    if (!resume || !jobDescription) {
      setError("Please upload a resume and provide a job description");
      return;
    }
    setLoading(true);
    setError("");
    setMatchScore(null);
    setExplanation("");
    setFileLocations(null);
    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDescription", jobDescription);

      // STEP 1: upload & parse
      const response = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process resume");

      setFileLocations({
        uploaded: data.uploadedPath,
        parsed: data.parsedPath,
      });

      const parsedFilename = data.parsedPath
        .split("/")
        .pop()
        .replace("_parsed.json", "");

      // STEP 2: match
      const matchResponse = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_filename: parsedFilename,
          job_description: jobDescription,
        }),
      });
      const matchData = await matchResponse.json();
      if (!matchResponse.ok) throw new Error(matchData.error || "Failed to rank resume");

      // display score & explanation
      setMatchScore(matchData.result.match_score);
      setExplanation(matchData.result.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-gray-900 font-[Inter]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shadow-sm">
        <div>
          <div className="text-2xl font-bold px-6 py-4 text-[#2563EB]">YourApp</div>
          <nav className="space-y-2 mt-4">
            <a
              href="#"
              className="flex items-center px-6 py-2 hover:bg-gray-100 rounded transition-colors duration-200 text-gray-700"
            >
              <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
            </a>
            <a
              href="#"
              className="flex items-center px-6 py-2 hover:bg-gray-100 rounded transition-colors duration-200 text-gray-700"
            >
              <BarChart2 className="w-5 h-5 mr-3" /> Top Candidates
            </a>
            <a
              href="#"
              className="flex items-center px-6 py-2 hover:bg-gray-100 rounded transition-colors duration-200 text-gray-700"
            >
              <Lightbulb className="w-5 h-5 mr-3" /> Insights
            </a>
            <a
              href="#"
              className="flex items-center px-6 py-2 hover:bg-gray-100 rounded transition-colors duration-200 text-gray-700"
            >
              <LifeBuoy className="w-5 h-5 mr-3" /> Support
            </a>
            <a
              href="#"
              className="flex items-center px-6 py-2 hover:bg-gray-100 rounded transition-colors duration-200 text-gray-700"
            >
              <Settings className="w-5 h-5 mr-3" /> Settings
            </a>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-6 py-2 text-red-500 hover:bg-gray-100 rounded mb-4 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Welcome, {user?.email}</h1>
            <p className="text-gray-500 mt-1">
              Start by uploading your resume and job description to get your match score.
            </p>
          </div>
          <UserCircle className="w-10 h-10 text-gray-400" />
        </div>

        <Card className="p-6 bg-white shadow rounded-2xl border border-gray-100">
          <CardContent className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">AI Resume Ranker</h2>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">Upload PDF Resume</label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                className="w-full rounded border-gray-300 focus:border-[#2563EB] focus:ring focus:ring-[#93C5FD]"
              />
              {resume && (
                <p className="text-green-600 text-sm flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {resume.name}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">Paste Job Description</label>
              <textarea
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#2563EB] focus:ring focus:ring-[#93C5FD]"
                placeholder="Enter job description here..."
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!resume || !jobDescription || loading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-2 rounded-lg shadow"
            >
              {loading ? "Processing..." : "Rank Resume"}
            </Button>

            {error && <p className="text-red-500 text-center font-medium">{error}</p>}

            {fileLocations && (
              <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Files Saved Successfully
                </h3>
                <p className="text-sm text-green-700">
                  <strong>Uploaded:</strong> {fileLocations.uploaded}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Parsed:</strong> {fileLocations.parsed}
                </p>
              </div>
            )}

            {(matchScore !== null || explanation) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2 text-gray-800">Match Score &amp; Explanation</h3>
                {matchScore !== null && (
                  <p className="text-1xl font-bold text-[#2563EB]">{matchScore}</p>
                )}
                {explanation && (
                  <div className="whitespace-pre-wrap mt-2 text-gray-600">
                    {explanation}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
