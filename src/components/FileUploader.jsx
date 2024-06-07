import React, { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import "./FileUploader.css";

const FileUploader = ({ onFilesCompressed }) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const compressedFiles = await Promise.all(
      selectedFiles.map(async (file) => {
        try {
          if (file.type.startsWith("image/")) {
            const compressedFile = await compressFile(file);
            return compressedFile;
          } else {
            return file;
          }
        } catch (error) {
          console.error("Ошибка при сжатии файла:", error);
          return file;
        }
      })
    );
    setFiles(compressedFiles);
    onFilesCompressed(compressedFiles);
  };

  const compressFile = async (file) => {
    const options = {
      maxSizeMB: 0.7,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const checkFileSize = (file) => {
    return file.size <= 700000; // 700 KB
  };

  return (
    <div className="file-uploader">
      <button className="file-uploader-button" onClick={handleClick}>
        Выберите файлы
      </button>
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => (
            <li key={index} className="file-item">
              {file.name}
              {checkFileSize(file) ? (
                <FaCheckCircle className="file-icon success" />
              ) : (
                <FaTimesCircle className="file-icon error" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
