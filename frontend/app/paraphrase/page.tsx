'use client'
import { useState } from "react";
import "./Paraphraser.css"; // Importing CSS file

export default function Paraphraser() {
  const [text, setText] = useState("");
  const [paraphrase, setParaphrase] = useState("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleParaphrase = async () => {
    setError(null);
    setParaphrase("");
    setAlternatives([]);

    if (!text.trim()) {
      setError("Please enter some text.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5003/paraphrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (response.ok) {
        setParaphrase(data.paraphrase);
        setAlternatives(data.alternatives);
      } else {
        setError(data.error || "An error occurred.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  const handleAccept = (selectedText: string) => {
    setText(selectedText);
  };

  return (
    <div className="paraphraser-body">
      <nav className="navbar">
        <div className="nav-title">DocAssist</div>
        <div className="nav-user">
          <img src="user.png" alt="User" className="user-icon" />
        </div>
      </nav>
    
    <div className="paraphraser-container">
     

      <div className="input-section">
        <h2>Enter Text</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to paraphrase..."
        />
        <button onClick={handleParaphrase}>Paraphrase</button>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="output-section">
        <h2>Paraphrased Output</h2>
        {paraphrase ? (
          <div className="paraphrase-item">
            <input
              type="checkbox"
              onChange={() => handleAccept(paraphrase)}
            />
            <p className="paraphrased-text">{paraphrase}</p>
          </div>
        ) : (
          <p className="placeholder">Your paraphrased text will appear here.</p>
        )}

        {alternatives.length > 0 && (
          <div>
            <h3>Alternative Suggestions</h3>
            <ul>
              {alternatives.map((alt, index) => (
                <li key={index} className="paraphrase-item">
                  <input
                    type="checkbox"
                    onChange={() => handleAccept(alt)}
                  />
                  <span>{alt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
