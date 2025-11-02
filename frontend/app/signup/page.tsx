"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Correct import for Next.js 13

const Signup: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const router = useRouter(); // Using useRouter from next/navigation

  useEffect(() => {
    setIsMounted(true); // Mark the component as mounted
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5001/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Signup successful!");

        // Save the JWT token to localStorage after signup
        localStorage.setItem("jwtToken", data.token);

        // Redirect to the dashboard or home page
        if (isMounted) {
          router.push("/login"); // Correct redirection with the updated useRouter
        }
      } else {
        alert(data.error || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#0D1117",
    },
    signupCard: {
      padding: "20px",
      backgroundColor: "#161B22",
      borderRadius: "8px",
      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
      width: "400px",
    },
    header: {
      textAlign: "center",
      color: "#C9D1D9",
    },
    input: {
      width: "95%",
      padding: "12px",
      margin: "10px 0",
      backgroundColor: "#24292F",
      color: "#C9D1D9",
      border: "1px solid #30363D",
      borderRadius: "5px",
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#58A6FF",
      color: "#161B22",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
  };

  // Avoid rendering the component logic until the client is ready
  if (!isMounted) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.signupCard}>
        <h1 style={styles.header}>Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
