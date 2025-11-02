"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const templates: Record<string, string> = {
  IEEE: `**Title:** Your Paper Title Here
**Author:** Your Name

**Abstract**
Your abstract goes here.

**Introduction**
Your introduction goes here.
 
**Literature Review**
Your literature review goes here.

**Methodology**
Your methodology goes here.

**Results**
Your results go here.

**Conclusion**
Your conclusion goes here.
`,

  Springer: `**Title:** Your Paper Title Here
**Author:** Your Name

**Abstract**
Your abstract goes here.

**Introduction**
Your introduction goes here.

**Background**
Your background goes here.

**Methods**
Your methods go here.

**Results**
Your results go here.

**Discussion**
Your discussion goes here.

**Conclusion**
Your conclusion goes here.
`,

  Elsevier: `**Title:** Your Paper Title Here
**Author:** Your Name

**Abstract**
Your abstract goes here.

**Introduction**
Your introduction goes here.

**Materials and Methods**
Your materials and methods go here.

**Results**
Your results go here.

**Discussion**
Your discussion goes here.

**Conclusion**
Your conclusion goes here.
`,
};

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [formattedText, setFormattedText] = useState<string>("");
  const [editableText, setEditableText] = useState<string>(templates["IEEE"]);
  const [format, setFormat] = useState<string>("IEEE");
  const [useManualInput, setUseManualInput] = useState<boolean>(true);

  // Citation states
  const [citationUrl, setCitationUrl] = useState("");
  const [citation, setCitation] = useState("");
  const [loadingCitation, setLoadingCitation] = useState(false);
  const [citationError, setCitationError] = useState("");
  const [isCitationPanelOpen, setIsCitationPanelOpen] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = "#fff";
    document.body.style.color = "#000";
  }, []);

  useEffect(() => {
    if (useManualInput) {
      setEditableText(templates[format]);
    }
  }, [format, useManualInput]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setUseManualInput(false);
    }
  };

  const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormat(event.target.value);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("format", format);

    if (useManualInput) {
      formData.append("manual_text", editableText);
    } else {
      if (!file) return alert("Please select a file first.");
      formData.append("file", file);
    }

    try {
      const response = await axios.post("http://127.0.0.1:5005/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormattedText(response.data.formatted_text);
      setEditableText(response.data.formatted_text);
    } catch (error) {
      console.error("Error uploading file", error);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditableText(event.target.value);
  };

  const downloadEditedText = () => {
    const blob = new Blob([editableText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `formatted_paper_${format}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateCitation = async () => {
    if (!citationUrl) return;
    setLoadingCitation(true);
    setCitationError("");
    try {
      const res = await axios.post("http://localhost:5011/generate-citation", { url: citationUrl });
      setCitation(res.data.citation);
    } catch (err) {
      setCitationError("Failed to generate citation. Please try again.");
      setCitation("");
    }
    setLoadingCitation(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
      {/* Left - Formatted Output */}
      <div
        style={{
          flex: 1,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
        }}
      >
        <h1 style={{ color: "black" }}>Research Paper Formatter</h1>

        <div className="format-select" style={{ color: "black", marginBottom: "1rem" }}>
          <label>Select Format:</label>
          <select value={format} onChange={handleFormatChange}>
            <option value="IEEE">IEEE</option>
            <option value="Springer">Springer</option>
            <option value="Elsevier">Elsevier</option>
          </select>
        </div>

        <div className="input-mode" style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
  <button
    onClick={() => setUseManualInput(true)}
    style={{
      padding: "10px 20px",
      borderRadius: "5px",
      border: useManualInput ? "2px solid #007bff" : "1px solid #ccc",
      backgroundColor: useManualInput ? "#007bff" : "#f0f0f0",
      color: useManualInput ? "#fff" : "#333",
      cursor: "pointer",
    }}
  >
    📝 Template
  </button>
  <button
    onClick={() => setUseManualInput(false)}
    style={{
      padding: "10px 20px",
      borderRadius: "5px",
      border: !useManualInput ? "2px solid #28a745" : "1px solid #ccc",
      backgroundColor: !useManualInput ? "#28a745" : "#f0f0f0",
      color: !useManualInput ? "#fff" : "#333",
      cursor: "pointer",
    }}
  >
    ⚙️ Auto-Formatting
  </button>
</div>

        
          {useManualInput ? (
            <textarea
              value={editableText}
              onChange={handleTextChange}
              className="text-box"
              style={{
                width: "95%",
                minHeight: "60vh",
                backgroundColor: "#fff",
                color: "black",
                padding: "10px",
                borderRadius: "10px",
              }}
            />
          ) : (
            <input type="file" accept=".txt" onChange={handleFileChange} style={{ marginTop: "1rem" }} />
          )}
          
          <button onClick={handleUpload} style={{ marginTop: "1rem" }}>
            Upload
          </button>
          
          {formattedText && (
            <>
              <h2 style={{ color: "black", marginTop: "1rem" }}>
                Formatted Output - {format}
              </h2>
              <textarea
                value={editableText}
                onChange={handleTextChange}
                style={{
                  width: "95%",
                  minHeight: "40vh",
                  backgroundColor: "#fff",
                  color: "black",
                  padding: "10px",
                  borderRadius: "10px",
                  marginTop: "1rem",
                }}
              />
              <button onClick={downloadEditedText} style={{ marginTop: "1rem" }}>
                Download Edited Text
              </button>
            </>
          )}
          
      </div>

      {/* Right - Markdown Preview */}
      <div
        style={{
          flex: 1,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          backgroundColor: "#f9f9f9",
        }}
      >
        <h2 style={{ color: "black" }}>Markdown Preview</h2>
        <div
          style={{
            width: "95%",
            minHeight: "80vh",
            backgroundColor: "#fff",
            color: "black",
            padding: "10px",
            borderRadius: "10px",
            overflowY: "auto",
          }}
        >
          <ReactMarkdown>{editableText}</ReactMarkdown>
        </div>
      </div>

      {/* Citation Panel */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setIsCitationPanelOpen(!isCitationPanelOpen)}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            padding: "10px 16px",
            borderRadius: "5px",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          {isCitationPanelOpen ? "Close Citations" : "Add Citation"}
        </button>

        {isCitationPanelOpen && (
          <div
            style={{
              position: "fixed",
              top: "0",
              right: "0",
              width: "300px",
              height: "100vh",
              backgroundColor: "#f9f9f9",
              borderLeft: "1px solid #ccc",
              padding: "20px",
              boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
              overflowY: "auto",
              zIndex: 999,
            }}
          >
            <h3 style={{ marginTop: "0", marginBottom: "1rem" }}>Add Citation</h3>

            <input
              type="text"
              placeholder="Enter DOI, URL, or Title"
              value={citationUrl}
              onChange={(e) => setCitationUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                marginBottom: "0.5rem",
              }}
            />

            <button
              onClick={handleGenerateCitation}
              style={{
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                borderRadius: "5px",
                cursor: "pointer",
                width: "100%",
                marginBottom: "1rem",
              }}
            >
              {loadingCitation ? "Generating..." : "Generate Citation"}
            </button>

            {citationError && <p style={{ color: "red", marginTop: "0.5rem" }}>{citationError}</p>}

            {citation && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "10px",
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  maxHeight: "200px",
                  overflowY: "auto",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                {citation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
