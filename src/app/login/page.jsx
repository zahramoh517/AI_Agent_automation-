"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";


export default function Login() {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Loading and navigation states
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(""); // New state for login status
  
  // Get authentication methods and user state from context
  const { signIn, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Effect to handle automatic redirection if user is already logged in
  useEffect(() => {
    console.log("Login page useEffect - Current user:", user ? "Logged in" : "Not logged in");
    console.log("Current pathname:", pathname);
    
    if (user && pathname === '/login') {
      console.log("User is authenticated, initiating dashboard redirect...");
      router.push("/dashboard");
    }
  }, [user, router, pathname]);

  /**
   * Handle login form submission
   * @param {Event} e - Form submit event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Login form submitted with email:", email);
    setLoading(true);
    setError("");
    setLoginStatus("Attempting to log in...");

    try {
      console.log("Calling signIn function...");
      // Attempt to sign in with provided credentials
      const userCredential = await signIn(email, password);
      console.log("Sign in successful, user:", userCredential.user.email);
      setLoginStatus("Login successful! Redirecting...");
      
      // Add a small delay before redirect to show the success message
      console.log("Setting up redirect timeout...");
      setTimeout(() => {
        console.log("Timeout completed, attempting redirect...");
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      setLoading(false);
      setLoginStatus("");
      // Handle different authentication errors with user-friendly messages
      switch (err.code) {
        case 'auth/invalid-credential':
          setError('Invalid email or password. Please try again.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email. Please register first.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray">
      {/* Login Form Container */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg border border-gray-200"> 
        <h1 className="text-3xl font-bold text-center text-orange-500">Login</h1>
        
        {/* Status Message Display */}
        {loginStatus && (
          <p className="text-center text-blue-600">{loginStatus}</p>
        )}
        
        {/* Error Message Display */}
        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded"
            disabled={loading}
            required
          />
          
          {/* Password Input */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded"
            disabled={loading}
            required
          />
          
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-orange-500 text-white rounded hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {loginStatus || "Logging in..."}
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Registration Link */}
        <p className="text-center">
          Don't have an account?{" "}
          <Link href="/register" className="text-orange-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}