"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");

  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLoginStatus("Attempting to log in...");

    try {
      console.log("🔐 Attempting sign in...");
      const userCredential = await signIn(email, password);
      console.log("✅ Sign in successful:", userCredential.user.email);
      setLoginStatus("Login successful! Redirecting...");

      // Immediately redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Login error:", err.code, err.message);
      setLoading(false);
      setLoginStatus("");

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
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-orange-500">Login</h1>

        {loginStatus && (
          <p className="text-center text-blue-600">{loginStatus}</p>
        )}

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded"
            disabled={loading}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded"
            disabled={loading}
            required
          />

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
