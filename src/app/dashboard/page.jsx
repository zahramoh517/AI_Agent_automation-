"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1128] text-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file");
        return;
      }
      setResume(file);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!resume || !jobDescription) {
      setError("Please upload a resume and provide a job description");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to process resume");

      const data = await response.json();
      setResult(data.result);
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
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1128] text-black px-4 pt-6">
      {/* Top header with logout */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-6">
        <p className="text-white text-lg">Welcome, {user?.email}</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Resume upload card */}
      <main>
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">AI Resume Ranker</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload PDF Resume</label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  className="w-full"
                />
                {resume && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">{resume.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paste Job Description</label>
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

            {error && <p className="text-red-500 text-center">{error}</p>}

            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Analysis Result</h3>
                <div className="whitespace-pre-wrap">{result}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
