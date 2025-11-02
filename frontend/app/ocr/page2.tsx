// "use client";
// import { useState } from "react";

// export default function OCRPage() {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [extractedText, setExtractedText] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files[0]) {
//       const file = event.target.files[0];
//       setSelectedFile(file);

//       // Show image preview
//       const reader = new FileReader();
//       reader.onloadend = () => setPreview(reader.result as string);
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleUpload = async () => {
//     if (!selectedFile) {
//       setError("Please select an image first.");
//       return;
//     }

//     setLoading(true);
//     setError("");
//     setExtractedText("");

//     const formData = new FormData();
//     formData.append("file", selectedFile);

//     try {
//       const response = await fetch("http://127.0.0.1:5004/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setExtractedText(data.text);
//       } else {
//         setError(data.error || "Something went wrong");
//       }
//     } catch (err) {
//       setError("Failed to connect to the server");
//     }

//     setLoading(false);
//   };

//   return (
//     <div className="container">
//       <h1>Image to Text (OCR)</h1>

//       <input type="file" accept="image/*" onChange={handleFileChange} />

//       {preview && (
//         <div className="preview">
//           <img src={preview} alt="Selected" />
//         </div>
//       )}

//       <button onClick={handleUpload} disabled={loading}>
//         {loading ? "Extracting..." : "Upload & Extract"}
//       </button>

//       {error && <p className="error">{error}</p>}

//       {extractedText && (
//         <div className="output">
//           <h2>Extracted Text:</h2>
//           <p>{extractedText}</p>
//         </div>
//       )}
//     </div>
//   );
// }

"use client";
import { useState } from "react";

export default function OCRPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      // Show image preview
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
    <div className="container">
      <h1>Image to Text (OCR)</h1>

      <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />

      <div className="content">
        {preview && (
          <div className="preview">
            <h2>Selected Image:</h2>
            <img src={preview} alt="Selected" />
          </div>
        )}

        {extractedText && (
          <div className="output">
            <h2>Extracted Text:</h2>
            <p>{extractedText}</p>
            <button className="export-btn" onClick={handleExport}>
              Export as .txt
            </button>
          </div>
        )}
      </div>

      <div className="button-group">
        <button onClick={handleUpload} disabled={loading} className="upload-btn">
          {loading ? "Extracting..." : "Upload & Extract"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}



