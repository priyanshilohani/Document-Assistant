"use client";
import { useState, useEffect } from "react";
import "./ocr.css";

export default function OCRPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.backgroundColor = "#f5f5f5";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setExtractedText("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:5004/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedText(data.text);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to connect to the server");
    }

    setLoading(false);
  };

  const handleExport = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "extracted_text.txt";
    link.click();
  };

  return ( 
    <div className="ocr-page">
      <nav className="navbar">
        <div className="nav-title">DocAssist</div>
        <div className="nav-user">
          
          <img src="user.png" alt="User" className="user-icon" />
        </div>
      </nav>

      <h1 className="ocr-title">OCR Image to Text</h1>


      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden-file-input"
      />

      <div className="ocr-content">
        <div className="ocr-panel ocr-preview">
          <div className="img-preview-header">
          <img src="images.png" alt="User" className="img-icon" />
          <h2>  Image Preview</h2>
          </div>
          
          {preview ? <img src={preview} alt="Selected" /> : <p>No image selected.</p>}
        </div>

        <div className="ocr-panel ocr-output">
          <h2>📝 Extracted Text</h2>
          <p>{extractedText || "Your text will appear here after extraction."}</p>
          {extractedText && (
            <button className="ocr-export-btn" onClick={handleExport}>
              📁 Export as .txt
            </button>
          )}
        </div>
      </div>

      <div className="ocr-btn-group-row">
        <label className="image-icon-label" htmlFor="fileInput">
          <img src="choose.png" alt="Choose File" className="image-icon" />
        </label>
        <button onClick={handleUpload} disabled={loading} className="ocr-upload-btn">
          {loading ? "⏳ Extracting..." : "⚡ Upload & Extract"}
        </button>
      </div>


      {error && <p className="ocr-error">{error}</p>}
    </div>
  );
}
