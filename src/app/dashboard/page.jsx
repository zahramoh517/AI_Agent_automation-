"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  Upload,
  FolderOpen,
  FileText,
  AlertCircle,
  Folder,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const dropZoneRef = useRef(null);

  // Single resume state
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [matchScore, setMatchScore] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [fileLocations, setFileLocations] = useState(null);

  // Batch processing state
  const [uploadMode, setUploadMode] = useState("single"); // "single" or "batch"
  const [batchFolder, setBatchFolder] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [batchProgress, setBatchProgress] = useState({
    total: 0,
    processed: 0,
    current: "",
    status: "idle" // "idle", "uploading", "processing", "matching", "complete"
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedExplanations, setExpandedExplanations] = useState(new Set());

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

  const handleBatchFolderUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pdfFiles = files.filter(file => file.type === "application/pdf");
    if (pdfFiles.length === 0) {
      setError("Please select PDF files only");
      return;
    }

    setBatchFolder(pdfFiles);
    setError("");
    setBatchResults([]);
    setBatchProgress({
      total: pdfFiles.length,
      processed: 0,
      current: "",
      status: "idle"
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (uploadMode !== "batch") return;

    const items = Array.from(e.dataTransfer.items);
    const files = [];

    const processEntry = async (entry) => {
      try {
        if (entry.isFile) {
          const file = await new Promise((resolve) => entry.file(resolve));
          if (file.type === "application/pdf") {
            files.push(file);
          }
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          const entries = await new Promise((resolve) => {
            reader.readEntries(resolve);
          });
          for (const childEntry of entries) {
            await processEntry(childEntry);
          }
        }
      } catch (error) {
        console.error("Error processing entry:", error);
      }
    };

    Promise.all(items.map(item => {
      if (item.webkitGetAsEntry) {
        const entry = item.webkitGetAsEntry();
        if (entry) return processEntry(entry);
      }
      return Promise.resolve();
    })).then(() => {
      if (files.length === 0) {
        setError("No PDF files found in the dropped folder");
        return;
      }

      setBatchFolder(files);
      setError("");
      setBatchResults([]);
      setBatchProgress({
        total: files.length,
        processed: 0,
        current: "",
        status: "idle"
      });
    }).catch(error => {
      console.error("Error processing dropped files:", error);
      setError("Error processing dropped folder. Please try again.");
    });
  };

  const handleSubmit = async () => {
    if (uploadMode === "single") {
      await handleSingleSubmit();
    } else {
      await handleBatchSubmit();
    }
  };

  const handleSingleSubmit = async () => {
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

  const handleBatchSubmit = async () => {
    if (!batchFolder || batchFolder.length === 0 || !jobDescription) {
      setError("Please select PDF files and provide a job description");
      return;
    }

    setBatchProgress({
      total: batchFolder.length,
      processed: 0,
      current: "Uploading files...",
      status: "uploading"
    });
    setError("");
    setBatchResults([]);

    try {
      // STEP 1: Upload and parse all resumes
      const formData = new FormData();
      batchFolder.forEach((file, index) => {
        formData.append(`resumes`, file);
      });
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/resume/batch", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process resumes");
      }

      const data = await response.json();
      
      setBatchProgress({
        total: batchFolder.length,
        processed: 0,
        current: "Matching resumes (with retry protection)...",
        status: "matching"
      });

      // STEP 2: Match all resumes
      const matchResponse = await fetch("/api/match/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_filenames: data.parsedFilenames,
          job_description: jobDescription,
          batch_folder: data.batchFolder,
        }),
      });

      if (!matchResponse.ok) {
        const errorData = await matchResponse.json();
        throw new Error(errorData.error || "Failed to match resumes");
      }

      const matchData = await matchResponse.json();
      
      // Sort results by match score (highest first)
      const sortedResults = matchData.results.sort((a, b) => 
        parseFloat(b.match_score) - parseFloat(a.match_score)
      );

      setBatchResults(sortedResults);
      setBatchProgress({
        total: batchFolder.length,
        processed: batchFolder.length,
        current: "",
        status: "complete"
      });

      // Show success message with file locations
      console.log(`✅ Batch processing complete. Files saved in: ${data.batchFolder}`);

    } catch (err) {
      setError(err.message);
      setBatchProgress({
        total: batchFolder.length,
        processed: 0,
        current: "",
        status: "idle"
      });
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

  const resetForm = () => {
    setResume(null);
    setBatchFolder(null);
    setJobDescription("");
    setError("");
    setMatchScore(null);
    setExplanation("");
    setFileLocations(null);
    setBatchResults([]);
    setBatchProgress({
      total: 0,
      processed: 0,
      current: "",
      status: "idle"
    });
    setExpandedExplanations(new Set());
  };

  const toggleExplanation = (index) => {
    const newExpanded = new Set(expandedExplanations);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExplanations(newExpanded);
  };

  const expandAllExplanations = () => {
    const allIndices = new Set(batchResults.map((_, index) => index));
    setExpandedExplanations(allIndices);
  };

  const collapseAllExplanations = () => {
    setExpandedExplanations(new Set());
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
              Start by uploading your resume(s) and job description to get match scores.
            </p>
          </div>
          <UserCircle className="w-10 h-10 text-gray-400" />
        </div>

        <Card className="p-6 bg-white shadow rounded-2xl border border-gray-100">
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">AI Resume Ranker</h2>
              <Button
                onClick={resetForm}
                variant="outline"
                className="text-sm"
              >
                Reset Form
              </Button>
            </div>

            {/* Upload Mode Toggle */}
            <div className="flex space-x-4 p-4 bg-gray-50 rounded-lg">
              <button
                onClick={() => setUploadMode("single")}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  uploadMode === "single"
                    ? "bg-[#2563EB] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FileText className="w-4 h-4 mr-2" />
                Single Resume
              </button>
              <button
                onClick={() => setUploadMode("batch")}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  uploadMode === "batch"
                    ? "bg-[#2563EB] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Multiple Resumes
              </button>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-600">
                {uploadMode === "single" ? "Upload PDF Resume" : "Select PDF Files or Drop Folder"}
              </label>
              
              {uploadMode === "single" ? (
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpload}
                  className="w-full rounded border-gray-300 focus:border-[#2563EB] focus:ring focus:ring-[#93C5FD]"
                />
              ) : (
                <div className="space-y-4">
                  {/* File Input */}
                  <Input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleBatchFolderUpload}
                    className="w-full rounded border-gray-300 focus:border-[#2563EB] focus:ring focus:ring-[#93C5FD]"
                  />
                  
                  {/* Drag & Drop Zone */}
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-[#2563EB] bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <Folder className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drop a folder here
                    </p>
                    <p className="text-sm text-gray-500">
                      Or click above to select individual PDF files
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      All PDF files in the folder will be processed
                    </p>
                  </div>
                </div>
              )}

              {uploadMode === "single" && resume && (
                <p className="text-green-600 text-sm flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> {resume.name}
                </p>
              )}

              {uploadMode === "batch" && batchFolder && (
                <div className="space-y-2">
                  <p className="text-green-600 text-sm flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> 
                    {batchFolder.length} PDF file(s) selected
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {batchFolder.map((file, index) => (
                      <p key={index} className="text-sm text-gray-600 ml-5">
                        • {file.name}
                      </p>
                    ))}
                  </div>
                </div>
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

            {/* Progress Indicator for Batch Processing */}
            {uploadMode === "batch" && batchProgress.status !== "idle" && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    {batchProgress.current || "Processing..."}
                  </span>
                  <span className="text-sm text-blue-600">
                    {batchProgress.processed}/{batchProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(batchProgress.processed / batchProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={
                (uploadMode === "single" && (!resume || !jobDescription)) ||
                (uploadMode === "batch" && (!batchFolder || batchFolder.length === 0 || !jobDescription)) ||
                loading ||
                batchProgress.status === "uploading" ||
                batchProgress.status === "processing" ||
                batchProgress.status === "matching"
              }
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium py-2 rounded-lg shadow"
            >
              {loading || batchProgress.status !== "idle" ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {batchProgress.status === "uploading" ? "Uploading..." :
                   batchProgress.status === "processing" ? "Processing..." :
                   batchProgress.status === "matching" ? "Matching..." : "Processing..."}
                </div>
              ) : (
                `Rank ${uploadMode === "single" ? "Resume" : "Resumes"}`
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Single Resume Results */}
            {uploadMode === "single" && fileLocations && (
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

            {uploadMode === "single" && (matchScore !== null || explanation) && (
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

            {/* Batch Processing Success Message */}
            {uploadMode === "batch" && batchProgress.status === "complete" && batchResults.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Batch Processing Complete
                </h3>
                <p className="text-sm text-green-700">
                  <strong>Files organized in:</strong> resumes_uploaded/{batchResults[0]?.batch_folder}/
                </p>
                <p className="text-sm text-green-700">
                  <strong>Parsed outputs in:</strong> resumes_parsed/{batchResults[0]?.batch_folder}/
                </p>
                <p className="text-sm text-green-700">
                  <strong>Successfully processed:</strong> {batchResults.length} resumes
                </p>
              </div>
            )}

            {/* Batch Results Table */}
            {uploadMode === "batch" && batchResults.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Ranked Candidates</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        onClick={expandAllExplanations}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Expand All
                      </Button>
                      <Button
                        onClick={collapseAllExplanations}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Collapse All
                      </Button>
                    </div>
                    {batchResults[0]?.batch_folder && (
                      <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        📁 {batchResults[0].batch_folder}
                      </div>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Rank</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Candidate</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Match Score</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Explanation
                          <span className="text-xs text-gray-500 font-normal ml-1">(click to expand)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {batchResults.map((result, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {result.candidate_name || result.filename || "Unknown"}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-[#2563EB]">
                            {result.match_score}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <span className={`${!expandedExplanations.has(index) ? 'line-clamp-2' : ''}`}>
                                  {result.explanation}
                                </span>
                                <button
                                  onClick={() => toggleExplanation(index)}
                                  className="ml-2 flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                                  title={expandedExplanations.has(index) ? "Collapse" : "Expand"}
                                >
                                  {expandedExplanations.has(index) ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
