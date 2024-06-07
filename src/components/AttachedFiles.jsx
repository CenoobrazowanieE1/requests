import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "./firebase";
import { FaDownload } from "react-icons/fa";
import "./AttachedFiles.css";

const AttachedFiles = ({ requestId }) => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!requestId) {
        console.error("Request ID is undefined");
        return;
      }

      try {
        const q = query(
          collection(firestore, "documents"),
          where("requestKey", "==", requestId)
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDocuments(docs);
      } catch (error) {
        console.error("Ошибка при загрузке документов:", error);
      }
    };

    fetchDocuments();
  }, [requestId]);

  const downloadDocument = async (doc) => {
    try {
      const byteArray = Uint8Array.from(atob(doc.fileContent), (c) =>
        c.charCodeAt(0)
      );
      const blob = new Blob([byteArray], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Ошибка при скачивании документа:", error);
    }
  };

  return (
    <div className="attached-files">
      {documents.length > 0 && (
        <div className="views-documents">
          <ul>
            {documents.map((doc) => (
              <li key={doc.id}>
                {doc.filename}{" "}
                <FaDownload
                  className="download-icon"
                  onClick={() => downloadDocument(doc)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AttachedFiles;
