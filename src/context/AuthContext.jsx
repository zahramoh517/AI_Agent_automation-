"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/init";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdToken,
} from "firebase/auth";
import { setCookie, destroyCookie } from "nookies";

// Create the authentication context
const AuthContext = createContext({});

/**
 * AuthProvider Component
 * Wraps your app and tracks auth state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    console.log("🔁 AuthContext useEffect running...");

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("📡 Firebase auth state changed. User is:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      console.log("🧹 Cleaning up Firebase auth listener...");
      unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      console.log("🔐 Attempting to sign in...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(userCredential.user);

      // Set auth token cookie for middleware
      setCookie(null, "firebase-auth-token", token, {
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });

      console.log("✅ Sign in successful:", userCredential.user.email);
      return userCredential;
    } catch (error) {
      console.error("❌ Sign in error:", error.code, error.message);
      throw error;
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log("🚪 Attempting to sign out...");
      await firebaseSignOut(auth);

      // Clear auth token cookie
      destroyCookie(null, "firebase-auth-token");

      console.log("✅ Sign out successful");
    } catch (error) {
      console.error("❌ Sign out error:", error.code, error.message);
      throw error;
    }
  };

  // Provide auth state + functions to rest of app
  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-orange-600 text-lg">Checking login...</span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for accessing auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
