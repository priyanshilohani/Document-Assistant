"use client";
import { useState } from "react";
import "./translate.css"; // Import the CSS file

export default function TranslatePage() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [language, setLanguage] = useState("en");

  const languages = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    hi: "Hindi",
    ru: "Russian",
  };

  const translateText = async () => {
    if (!text) return;

    try {
      const response = await fetch("http://127.0.0.1:5006/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_lang: language }),
      });

      const data = await response.json();
      setTranslatedText(data.translated_text || "Translation failed.");
    } catch (error) {
      console.error("Translation error:", error);
      setTranslatedText("Error translating text.");
    }
  };

  return (
    <div className="translate-container">
      <h1>Multi-Language Translator</h1>
      <textarea
        className="input-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to translate..."
      />
      <select
        className="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        {Object.entries(languages).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
      <button className="translate-button" onClick={translateText}>
        Translate
      </button>
      <div className="output-text">{translatedText}</div>
    </div>
  );
}
