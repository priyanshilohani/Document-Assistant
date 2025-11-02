

"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import Image from "next/image";
import Cookies from "js-cookie";
import "quill/dist/quill.snow.css"; // Ensure Quill CSS is imported
import "quill/dist/quill.snow.css";
import { FaUserCircle } from "react-icons/fa"; // Import user profile icon
import { FaSpinner } from "react-icons/fa";

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
  const [showEditDropdown, setShowEditDropdown] = useState(false);
  const [showFileDropdown, setShowFileDropdown] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const quillRef = useRef<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const fileInputUploadRef = useRef<HTMLInputElement | null>(null);
  // Fetch token on mount
  useEffect(() => {
    document.body.style.backgroundColor = "white";
    document.body.style.color = 'black';

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

    // const fetchUploadedFiles = async () => {
    //   try {
    //     const response = await fetch("http://localhost:5002/get-uploads"); // Adjust URL to match your backend
    //     if (!response.ok) throw new Error("Failed to fetch uploaded files");

    //     const data = await response.json();
    //     setUploadedFiles(data.files); // Assume API returns { files: ["file1.docx", "file2.pdf"] }
    //   } catch (error) {
    //     console.error("Error fetching uploaded files:", error);
    //   }
    // };

    //   fetchUploadedFiles();
  }, []);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ color: ["#000000", "#e60000", "#ff9900", "#ffff00", "#008a00", "#0066cc", "#9933ff", "#ffffff", "#facccc", "#ffebcc", "#ffffcc", "#cce8cc", "#cce0f5", "#ebd6ff", "#bbbbbb", "#f06666", "#ffc266", "#ffff66", "#66b966", "#66a3e0", "#c285ff", "#888888", "#a10000", "#b26b00", "#b2b200", "#006100", "#0047b2", "#6b24b2", "#444444", "#5c0000", "#663d00", "#666600", "#003700", "#002966", "#3d1466",] }],
      ["blockquote", "code-block"],
      ["formula"], // 👈 This is native math support

      ["clean"],

    ],

    clipboard: {
      matchVisual: false, // Prevent Quill from modifying pasted content's visual appearance
    },
  };
  const handleUndo = () => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      editor.history.undo();
    }
  };

  const handleRedo = () => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      editor.history.redo();
    }
  };

  const handleCut = () => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      const selection = editor.getSelection();
      if (selection) {
        const text = editor.getText(selection.index, selection.length);
        navigator.clipboard.writeText(text);
        editor.deleteText(selection.index, selection.length);
      }
    }
  };

  const handleSelectAll = () => {
    const editor = quillRef.current?.getEditor();
    if (editor) {
      editor.setSelection(0, editor.getLength());
    }
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
  const handleMouseEnter = (menu: string) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current); // Prevent closing if user moves back quickly
    }
    setOpenDropdown(menu);
  };
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return "Invalid Date"; // Handle invalid dates gracefully
    }
    return date.toLocaleString(); // Customize format as needed
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 500); // Wait 500ms before closing
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
  
    // Immediately add file name
    setUploadedFiles((prev) => [...prev, files[0].name]);
  
    setUploading(true);
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to process document: ${errorText}`);
      }
  
      const data = await response.json();
      console.log("Processed:", data);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error);
    } finally {
      setUploading(false);
    }
  };
  const handleOpenDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5002/open-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to open document");
      }

      const data = await response.json();
      setContent(data.text); // Load text into the editor
      setDocumentTitle(file.name);
    } catch (error) {
      console.error("Error opening document:", error);
    } finally {
      setUploading(false);
    }
  };
  const handleSaveProgress = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("User not authenticated! Please log in.");
        return;
      }

      const response = await fetch("http://localhost:5002/save-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Added token
        },
        body: JSON.stringify({
          title: documentTitle.trim(),
          content: content, // Should be the actual content state
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Progress saved successfully! Document ID: " + data.document_id);
      } else {
        alert("Error saving: " + data.error);
      }
    } catch (error) {
      alert("Failed to connect: " + error);
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
      setLoadingSuggestions(true); // Start spinner

      const response = await fetch("http://localhost:5002/get-suggestions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: plainText }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("Error fetching suggestions:", data.error);
        alert(data.error);
        return;
      }

      if (data.suggestions) {
        setSuggestions(
          data.suggestions.map(
            (s: { filename: string; content_snippet: string }, index: number) => ({
              id: index,
              text: s.content_snippet,
            })
          )
        );
      } else {
        alert("No suggestions available.");
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      alert("An error occurred while fetching suggestions.");
    } finally {
      setLoadingSuggestions(false); // Stop spinner
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
      <div className={styles["navbar"]}>
        {/* Left Side: App Name & Document Title */}
        <div className={styles["app-info"]}>
          <span className={styles["app-name"]}>DocAssist</span>
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            className={styles["file-name-input"]}
            placeholder="Untitled Document"
          />
        </div>

        {/* File Dropdown */}
        <div
          className={styles["dropdown-container"]}
          onMouseEnter={() => handleMouseEnter("file")}
          onMouseLeave={handleMouseLeave}
        >
          <button className={styles["dropdown-button"]}>File</button>
          {openDropdown === "file" && (
            <div className={styles["dropdown-menu"]}>
              <button onClick={handleSaveProgress}>Save Progress to Database</button>
              <button onClick={handleSave}>Download Document</button>
              <button onClick={handleNewDocument}>New Document</button>
              <button onClick={() => fileInputRef.current?.click()}>Open Document</button>
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleOpenDocument}
                ref={fileInputRef}
                style={{ display: "none" }} // Hide ugly input
              />
            </div>

          )}
        </div>

        {/* Edit Dropdown */}
        <div
          className={styles["dropdown-container"]}
          onMouseEnter={() => handleMouseEnter("edit")}
          onMouseLeave={handleMouseLeave}
        >
          <button className={styles["dropdown-button"]}>Edit</button>
          {openDropdown === "edit" && (
            <div className={styles["dropdown-menu"]}>
              <button onClick={handleCopy}>Copy</button>
              <button onClick={handlePaste}>Paste</button>
              <button onClick={handleCut}>Cut</button>
              <button onClick={handleSelectAll}>Select All</button>
            </div>
          )}

        </div>

        {/* Right Side: User Profile Icon */}
        <div className={styles["user-profile"]}>
          <FaUserCircle size={28} color="gray" />
        </div>
      </div>
      <div className={styles["layout-container"]}>
        {/* Left Panel - Uploaded Documents */}
        <div className={styles["left-panel"]}>
          {/* Left Panel - File Upload */}
          <div className={styles["file-upload-container"]}>
            <input
              type="file"
              accept=".pdf, .docx, .txt"
              onChange={handleFileUpload}
              className={styles["file-input"]}
              ref={fileInputRef}
              style={{ display: "none" }} // Hide default file input
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles["icon-btn"]}
              disabled={uploading}
            >
              {uploading ? (
                <FaSpinner className={styles["spinner"]} />
              ) : (
                <img
                  src="/add-document.png"
                  alt="Upload Icon"
                  className={styles["button-icon"]}
                />
              )}
            </button>


          </div>


          <h3>Uploaded Documents</h3>
          {uploadedFiles.length > 0 ? (
            <div className={styles["uploaded-files-list"]}>
             {uploadedFiles.length > 0 ? (
  <div className={styles["uploaded-files-list"]}>
    {uploadedFiles.map((fileName, index) => (
      <div key={index} className={styles["file-box"]}>
        <span className={styles["file-link"]}>📄 {fileName}</span>
      </div>
    ))}
  </div>
) : (
  <p className={styles["no-files"]}>No documents uploaded</p>
)}

            </div>

          ) : (
            <p>No documents uploaded</p>
          )}
        </div>

        {/* Text Editor */}
        <div className={styles["editor-area"]}>
          <ReactQuill value={content} onChange={(value) => setContent(value)} theme="snow" modules={modules} />
        </div>

        {/* Right Panel - Suggestions */}
        {/* Right Panel - Suggestions */}
        <div className={styles["suggestions-panel"]}>
  <div className={styles["suggestions-header"]}>
    <button
      className={styles["icon-btn"]}
      onClick={handleGetSuggestions}
      disabled={loadingSuggestions}
    >
      {loadingSuggestions ? (
        <FaSpinner className={styles["spinner"]} />
      ) : (
        <img
          src="/stars.png"
          alt="Suggestions Icon"
          className={styles["heading-icon"]}
        />
      )}
    </button>
    <h3>Suggestions</h3>
  </div>

  <div className={styles["suggestions-content"]}>
    {loadingSuggestions ? (
      <div className={styles["loading-text"]}>Loading suggestions...</div>
    ) : suggestions.length > 0 ? (
      <ul className={styles["suggestions-list"]}>
        {suggestions.map((suggestion) => (
          <li key={suggestion.id} className={styles["suggestion-item"]}>
          <p>{suggestion.text}</p>
          <button
            onClick={() => handleAcceptSuggestion(suggestion.text)}
            className={styles["accept-btn"]}
          >
            Accept
          </button>
        </li>
        ))}
      </ul>
    ) : (
      <div className={styles["no-suggestions"]}>No suggestions available</div>
    )}
  </div>
</div>
      </div>
    </div>
  );
}

