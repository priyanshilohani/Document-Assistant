

"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import Image from "next/image";
import Cookies from "js-cookie";
import "quill/dist/quill.snow.css"; // Ensure Quill CSS is imported
import "quill/dist/quill.snow.css";

import styles from "./TextEditor.module.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function TextEditor() {
  const [content, setContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: number; text: string }[]>([]);
  const [documentChunks, setDocumentChunks] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Fetch token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedToken = Cookies.get("token") || localStorage.getItem("token");
  
      if (storedToken) {
        try {
          // Just setting the token without extracting userId
          setToken(storedToken);
        } catch (error) {
          console.error("Error processing token:", error);
          Cookies.remove("token");
          localStorage.removeItem("token");
        }
      }
    }
  }, []);
    
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: [ "#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff", "#ffffff", "#facccc", "#ffebcc", "#ffffcc", "#cce8cc", "#cce0f5", "#ebd6ff", "#bbbbbb", "#f06666", "#ffc266", "#ffff66", "#66b966", "#66a3e0", "#c285ff", "#888888", "#a10000", "#b26b00", "#b2b200", "#006100", "#0047b2", "#6b24b2", "#444444", "#5c0000", "#663d00", "#666600", "#003700", "#002966", "#3d1466", ] }],
      ["blockquote", "code-block"],
      ["clean"],
    ],
  };

  // Save document as .docx
  const handleSave = async () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const plainText = doc.body.textContent || "";

    const wordDoc = new Document({
      sections: [
        {
          children: [new Paragraph({ children: [new TextRun(plainText)] })],
        },
      ],
    });

    const blob = await Packer.toBlob(wordDoc);
    saveAs(blob, `${documentTitle || "Untitled Document"}.docx`);
  };

  // Open a new document
  const handleNewDocument = () => {
    setContent(""); // Clears the editor
    setDocumentTitle("Untitled Document");
  };

  // Copy text
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
  };

  // Paste text
  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setContent((prev) => prev + text);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setFile(files[0]); // Store the uploaded file

    if (!token) {
      alert("You are not authenticated. Please log in.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const response = await fetch("http://localhost:5002/process-document", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text(); // Get error message
        throw new Error(`Failed to process document: ${errorText}`);
      }

      const data = await response.json();
      if (data.chunks) {
        setDocumentChunks(data.chunks);
        setUploadedFiles((prevFiles) => [...prevFiles, files[0].name]);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(error);
    } finally {
      setUploading(false);
    }
  };

  // Fetch suggestions
  const handleGetSuggestions = async () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const plainText = doc.body.textContent?.trim() || "";

    if (!plainText) {
        alert("Editor content is empty!");
        return;
    }

    if (!token) {
        alert("You are not authenticated. Please log in.");
        return;
    }

    try {
        const response = await fetch("http://localhost:5002/get-suggestions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_input: plainText }), // Changed "content" to "user_input"
        });

        const data = await response.json();
        if (data.error) {
            console.error("Error fetching suggestions:", data.error);
            alert(data.error);
            return;
        }

        // Set suggestions if available
        if (data.suggestions) {
            setSuggestions(
                data.suggestions.map((s: { filename: string; content_snippet: string }, index: number) => ({
                    id: index,
                    text: s.content_snippet,
                }))
            );
        } else {
            alert("No suggestions available.");
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        alert("An error occurred while fetching suggestions.");
    }
};

// Accept suggestion
  const handleAcceptSuggestion = (suggestionText: string) => {
    const plainText = suggestionText.replace(/•/g, "").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    setContent(content + " " + plainText);
  };

  return (
    <div className={styles["editor-container"]}>
      {/* Top Menu Bar */}
      <div className={styles["top-bar"]}>
        <input type="text" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} className={styles["file-name-input"]} />

        <div className={styles["menu"]}>
          <span>File</span>
          <div className={styles["dropdown"]}>
            <button onClick={handleSave}>
              <Image src="/folder-download.png" width={20} height={20} alt="Save" /> Save Document
            </button>
            <button onClick={handleNewDocument}>
              <Image src="/add-document.png" width={20} height={20} alt="New" /> Open New Document
            </button>
          </div>
        </div>
      </div>

      <div className={styles["layout-container"]}>
        <div className={styles["suggestions-panel"]}>
          <h3>Suggestions</h3>
          <label htmlFor="file-upload" className={styles["file-upload-label"]} style={{ cursor: "pointer" }}>
            <Image src="/upload.png" width={25} height={25} alt="Upload File" className={styles["upload-icon"]} />
          </label>
          <input id="file-upload" type="file" multiple onChange={handleFileUpload} accept=".pdf,.txt,.docx" style={{ display: "none" }} />
          {uploading && <p>Uploading...</p>}
          {uploadedFiles.map((fileName, index) => (
            <div key={index} className={styles["file-name-item"]}>{fileName}</div>
          ))}
          <button className={styles["suggestions-btn"]} onClick={handleGetSuggestions}>
            <Image src="/suggestion.png" width={40} height={40} alt="Suggestions" className={styles["suggestion-icon"]} />
          </button>
          <ul>
  {suggestions.length === 0 ? (
    <p>No suggestions available</p>
  ) : (
    suggestions.map((suggestion) => (
      <li key={suggestion.id}>
        <pre>{suggestion.text}</pre>
        <button onClick={() => handleAcceptSuggestion(suggestion.text)}>Accept</button>
      </li>
    ))
  )}
</ul>


        </div>

        {/* Text Editor */}
        <div className={styles["editor-area"]}>
        <ReactQuill value={content} onChange={(value) => setContent(value)} theme="snow" modules={modules} />
        </div>
      </div>
    </div>
  );
}
