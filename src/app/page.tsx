'use client';

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0A1128] text-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">AI-Powered</span>
            <span className="block text-orange-500">Resume Analysis</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Upload your resume and get instant AI-powered analysis against job descriptions. 
            Get detailed insights and improve your chances of landing your dream job.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/login')}
                className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 md:py-4 md:text-lg md:px-10"
              >
                Login
              </Button>
              <Button
              
                onClick={() => router.push('/register')}
                variant="outline"
                className="w-full sm:w-auto px-8 py-3 text-base font-medium rounded-md text-orange-500 border-orange-500 hover:bg-orange-500/10 md:py-4 md:text-lg md:px-10"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
              <p className="text-gray-300">
                Our AI analyzes your resume against job descriptions to provide detailed insights and recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
              <p className="text-gray-300">
                Get immediate feedback on how well your resume matches specific job requirements.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2">Improvement Tips</h3>
              <p className="text-gray-300">
                Receive actionable suggestions to enhance your resume and increase your chances of success.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Resume</h3>
            <p className="text-gray-300">
              Upload your resume in PDF format
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Add Job Description</h3>
            <p className="text-gray-300">
              Paste the job description you're applying for
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Analysis</h3>
            <p className="text-gray-300">
              Receive detailed analysis and improvement suggestions
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 