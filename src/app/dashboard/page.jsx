"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-black text-white p-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </header>
      <main className="p-8">
        <p>Welcome, {user.email}!</p>
        <button 
          onClick={() => auth.signOut()}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
        >
          Logout
        </button>
      </main>
    </div>
  );
}