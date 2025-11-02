"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import "./notesdrive.css";

interface Document {
  _id: string;
  document_name: string;
  timestamp: string;
  content?: string;
}

const NotesDrive = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("🔐 No token found. Please log in.");
          return;
        }

        const docsResponse = await axios.get<{ documents: Document[] }>(
          "http://127.0.0.1:5008/get-user-documents",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setDocuments(docsResponse.data.documents || []);
      } catch (err) {
        setError("❌ Failed to load documents. Try again later.");
      }
    };
    fetchDocuments();
  }, []);

  const openDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("🔐 No token found. Please log in.");
        return;
      }
      const response = await axios.get<{ document_name: string; timestamp: string; content: string }>(
        `http://127.0.0.1:5008/get-document/${docId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      const documentData = response.data;
      const formattedDate = new Date(documentData.timestamp).toLocaleDateString();
  
      const newTab = window.open("", "_blank");
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>${documentData.document_name}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                pre { white-space: pre-wrap; font-size: 16px; }
              </style>
            </head>
            <body>
              <h1>📝 ${documentData.document_name}</h1>
              <p><strong>Uploaded on:</strong> ${formattedDate}</p>
              <pre>${documentData.content}</pre>
            </body>
          </html>
        `);
        newTab.document.close();
      }
    } catch (err) {
      setError("❌ Failed to load document content.");
    }
  };
  
  const deleteDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("🔐 No token found. Please log in.");
        return;
      }
      await axios.delete(`http://127.0.0.1:5008/delete-document/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(documents.filter((doc) => doc._id !== docId));
    } catch (err) {
      setError("❌ Failed to delete document.");
    }
  };

  return (
    <div className="notes-drive-container">
      <nav className="navbar">
        <div className="nav-title">DocAssist</div>
      </nav>

      <h1 className="notes-title">📚 Your Documents</h1>
      {error && <p className="error-text">{error}</p>}
      <ul className="documents-list">
        {documents.map((doc) => (
          <li key={doc._id} className="document-item">
            <div className="document-info" onClick={() => openDocument(doc._id)}>
              <strong>📄 {doc.document_name}</strong>
              <p>Uploaded on: {new Date(doc.timestamp).toLocaleDateString()}</p>
            </div>
            <button className="delete-btn" onClick={() => deleteDocument(doc._id)}> Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotesDrive;