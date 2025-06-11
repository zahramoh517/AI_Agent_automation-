"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const runLogout = async () => {
      await signOut();
      router.push("/login");
    };

    runLogout();
  }, [signOut, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-orange-600">
      Logging out...
    </div>
  );
}
