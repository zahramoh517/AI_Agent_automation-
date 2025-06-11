"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileUp, CheckCircle2 } from "lucide-react";

/**
 * Dashboard Page Component
 * Protected page that requires authentication
 * Displays resume upload and analysis interface
 */
export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Effect to handle authentication and redirection
  useEffect(() => {
    console.log("Dashboard useEffect - Auth loading:", authLoading);
    console.log("Current user:", user ? "Logged in" : "Not logged in");
    console.log("Current pathname:", pathname);

    if (!authLoading && !user && pathname === '/dashboard') {
      console.log("No authenticated user, redirecting to login...");
      router.push("/login");
    }
  }, [user, authLoading, router, pathname]);

  // Show loading state while checking authentication
  if (authLoading) {
    console.log("Dashboard: Checking authentication...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    console.log("Dashboard: No authenticated user, not rendering content");
    return null;
  }

  console.log("Dashboard: Rendering for authenticated user:", user.email);

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

      if (!response.ok) {
        throw new Error("Failed to process resume");
      }

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
    <div className="min-h-screen bg-white text-black">
      <header className="bg-black text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="p-8">
        <div className="mb-8">
          <p className="text-lg">Welcome, {user.email}!</p>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold">Resume Analysis</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Resume (PDF)</label>
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
              <label className="text-sm font-medium">Job Description</label>
              <Textarea
                rows={5}
                placeholder="Paste the job description here..."
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
                "Analyze Resume"
              )}
            </Button>

            {error && (
              <p className="text-red-500 text-center">{error}</p>
            )}

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