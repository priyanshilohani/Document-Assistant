"use client";
import { useState } from "react";

export default function GrammarChecker() {
  const [text, setText] = useState("");
  const [correctedText, setCorrectedText] = useState("");

  const handleCheckGrammar = async () => {
    if (!text.trim()) {
      alert("Please enter text to check.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5007/checkgrammar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (data.corrected_text) {
        setCorrectedText(data.corrected_text);
      } else {
        alert("Error correcting text.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to check grammar. Is the server running?");
    }
  };

  return (
    <div className="container">
      <h1 className="title">Grammar Checker</h1>
      <textarea
        className="text-area"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text here..."
      />
      <button className="check-btn" onClick={handleCheckGrammar}>
        Check Grammar
      </button>
      {correctedText && (
        <div className="result">
          <h2>Corrected Text:</h2>
          <p>{correctedText}</p>
        </div>
      )}
    </div>
  );
}
