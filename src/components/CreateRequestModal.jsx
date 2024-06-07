import React, { useState, useEffect } from "react";
import { ref, push, get, update } from "firebase/database";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { database, firestore } from "./firebase";
import CustomSelect from "./CustomSelect";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import FloatingMessage from "./FloatingMessage";
import FileUploader from "./FileUploader";
import "./CreateRequestModal.css";

const CreateRequestModal = ({ onClose, currentUser }) => {
  const [requestNumber, setRequestNumber] = useState("");
  const [executive, setExecutive] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [users, setUsers] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [closing, setClosing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLatestRequestNumber = async () => {
      const requestRef = ref(database, "requests");
      const snapshot = await get(requestRef);
      const requests = snapshot.val();
      const latestRequestNumber = requests
        ? Math.max(...Object.values(requests).map((r) => r.number))
        : 0;
      setRequestNumber(latestRequestNumber + 1);
    };

    const fetchUsers = async () => {
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);
      const usersData = snapshot.val();
      if (usersData) {
        const usersList = Object.values(usersData).map((user) => ({
          value: user.fullName,
          label: user.fullName,
        }));
        setUsers(usersList);
      }
    };

    fetchLatestRequestNumber();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => {
        setFormError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [formError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const addProduct = (product) => {
    setProducts([...products, product]);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (products.length === 0) {
      setFormError("Необходимо добавить хотя бы один товар.");
      return;
    }
    if (!executive) {
      setFormError("Пожалуйста, выберите ответственного.");
      return;
    }

    setLoading(true);

    const newRequest = {
      number: requestNumber,
      date: new Date().toLocaleString(),
      initiator: currentUser.fullName,
      statusRequest: "Новая",
      executive: executive.value,
      items: products,
      hasFile: files.length > 0,
    };

    try {
      const requestRef = ref(database, "requests");
      const newRequestRef = push(requestRef);
      await update(newRequestRef, newRequest);

      if (files.length > 0) {
        await Promise.all(
          files.map((file) =>
            attachDocumentToRequest(newRequestRef.key, requestNumber, file)
          )
        );
      }

      setSuccessMessage(`Заявка ${requestNumber} успешно добавлена!`);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Ошибка при создании заявки:", error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (products.length > 0 || files.length > 0) {
      setShowWarning(true);
    } else {
      setClosing(true);
      setTimeout(onClose, 500);
    }
  };

  const confirmClose = () => {
    setClosing(true);
    setTimeout(onClose, 500);
  };

  const attachDocumentToRequest = async (requestKey, requestNumber, file) => {
    try {
      const fileContent = await readFileContent(file);
      const documentData = {
        requestKey: requestKey,
        requestNumber: requestNumber,
        filename: file.name,
        fileContent: fileContent,
        timestamp: serverTimestamp(),
      };

      const docRef = collection(firestore, "documents");
      await addDoc(docRef, documentData);

      const requestRef = ref(database, `requests/${requestKey}`);
      const snapshot = await get(requestRef);
      const request = snapshot.val();
      const updatedRequest = {
        ...request,
        hasFile: true,
      };
      await update(requestRef, updatedRequest);
    } catch (error) {
      console.error("Ошибка при прикреплении документа:", error);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileContent = reader.result.split(",")[1];
        resolve(fileContent);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFilesCompressed = (compressedFiles) => {
    setFiles(compressedFiles);
  };

  return (
    <div className={`modal-overlay ${closing ? "fade-out" : ""}`}>
      <div
        className={`create-requests-modal-content ${
          closing ? "fade-out" : "fade-in"
        }`}
      >
        <div className="create-requests-modal-header">
          <h2>Заявка № {requestNumber}</h2>
          <button
            className="create-requests-modal-close"
            onClick={handleCancel}
          >
            Закрыть
          </button>
        </div>
        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-top">
            <div className="form-group">
              <label
                className={executive === null && formError ? "required" : ""}
              >
                Ответственный
              </label>
              <CustomSelect
                options={users}
                value={executive}
                onChange={setExecutive}
                placeholder="ФИО"
                isClearable
                className={executive === null && formError ? "error" : ""}
              />
            </div>
          </div>
          <ProductForm addProduct={addProduct} setError={setError} />
        </form>
        <div className="product-table-container">
          <ProductTable products={products} setProducts={setProducts} />
        </div>
        <div className="create-requests-modal-footer">
          <FileUploader onFilesCompressed={handleFilesCompressed} />
          <button
            type="submit"
            className="submit-request-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Отправка..." : "Отправить заявку"}
          </button>
        </div>
        {showWarning && (
          <div className="warning-overlay">
            <div className="warning-content">
              <p>
                У вас есть несохраненные данные. Вы уверены, что хотите закрыть?
              </p>
              <button onClick={confirmClose} className="confirm-button">
                Закрыть
              </button>
              <button
                onClick={() => setShowWarning(false)}
                className="cancel-button"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
      {error && <FloatingMessage message={error} />}
      {formError && <FloatingMessage message={formError} />}
      {successMessage && <FloatingMessage message={successMessage} success />}
    </div>
  );
};

export default CreateRequestModal;
