// src/context/AuthContext.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/init";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";

// Create the authentication context
const AuthContext = createContext({});

/**
 * AuthProvider Component
 * Provides authentication context to the entire application
 * Manages user authentication state and methods
 */
export function AuthProvider({ children }) {
  // State to store the current user
  const [user, setUser] = useState(null);
  // State to track if authentication is being checked
  const [loading, setLoading] = useState(true);

  // Effect to handle authentication state changes
  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up auth state listener...");
      unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise} - Firebase auth promise
   */
  const signIn = async (email, password) => {
    try {
      console.log("Attempting to sign in...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful:", userCredential.user.email);
      return userCredential;
    } catch (error) {
      console.error("Sign in error:", error.code, error.message);
      throw error;
    }
  };

  /**
   * Sign out the current user
   * @returns {Promise} - Firebase auth promise
   */
  const signOut = async () => {
    try {
      console.log("Attempting to sign out...");
      await firebaseSignOut(auth);
      console.log("Sign out successful");
    } catch (error) {
      console.error("Sign out error:", error.code, error.message);
      throw error;
    }
  };

  // Value object to be provided by the context
  const value = {
    user,        // Current user object
    loading,     // Loading state
    signIn,      // Sign in function
    signOut      // Sign out function
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};