import React, { useState, useEffect, useCallback, useRef } from "react";
import { ref, update, get, push } from "firebase/database";
import { database, firestore } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FaDownload } from "react-icons/fa";
import CustomSelect from "./CustomSelect";
import ProductForm from "./ProductForm";
import ProductTable from "./ProductTable";
import FloatingMessage from "./FloatingMessage";
import FileUploader from "./FileUploader";
import "./CreateRequestModal.css";
import "./AttachedFiles.css";
import "./FileUploader.css";

const EditRequestModal = ({ onClose, request, currentUser }) => {
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
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [status, setStatus] = useState(request.statusRequest);
  const [editWarning, setEditWarning] = useState(false);

  const statusOptions = [{ value: "В работе", label: "В работе" }];
  const productTableRef = useRef(null);

  const isCompleted = (product) =>
    product.status === "Выполнена" || product.status === "Отменена";

  const checkCompletion = useCallback(
    (products) => products.every(isCompleted),
    []
  );

  const loadItems = async () => {
    const itemsRef = ref(database, "items");
    const snapshot = await get(itemsRef);
    return snapshot.val();
  };

  const updateCacheAndFirebase = async (products) => {
    const items = await loadItems();

    const codeVariationToNameBaseUnitMap = {};
    const nameVariationBaseUnitToCodeMap = {};

    Object.keys(items).forEach((key) => {
      const { code, name, variation, baseUnit } = items[key];
      const itemCodeAsString = String(code);
      const codeVariation = `${itemCodeAsString}-${variation}`;
      codeVariationToNameBaseUnitMap[codeVariation] = { name, baseUnit };
      nameVariationBaseUnitToCodeMap[`${name}-${variation}-${baseUnit}`] =
        itemCodeAsString;
    });

    for (const item of products) {
      const { code, variation, name, baseUnit } = item;
      if (code) {
        const codeVariationKey = `${String(code)}-${variation}`;
        const existingItem = codeVariationToNameBaseUnitMap[codeVariationKey];
        if (existingItem) {
          item.name = existingItem.name;
          item.baseUnit = existingItem.baseUnit;
        } else {
          item.code = ""; // Clear the code if the combination doesn't exist
        }
      } else {
        const nameVariationBaseUnitKey = `${name}-${variation}-${baseUnit}`;
        const existingCode =
          nameVariationBaseUnitToCodeMap[nameVariationBaseUnitKey];
        if (existingCode) {
          item.code = existingCode;
        } else {
          const newItemRef = push(ref(database, "items"));
          await update(newItemRef, item);
          nameVariationBaseUnitToCodeMap[nameVariationBaseUnitKey] = item.code;
          codeVariationToNameBaseUnitMap[`${item.code}-${variation}`] = {
            name,
            baseUnit,
          };
        }
      }
    }

    return products;
  };

  useEffect(() => {
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

    const fetchDocuments = async () => {
      if (!request.id) {
        console.error("Request ID is undefined");
        return;
      }

      try {
        const q = query(
          collection(firestore, "documents"),
          where("requestKey", "==", request.id)
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
      setDocumentsLoading(false);
    };

    fetchUsers();
    fetchDocuments();

    if (request) {
      setExecutive({ value: request.executive, label: request.executive });
      setProducts(request.items || []);
    }
  }, [request]);

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

    // Проверяем, есть ли редактируемые строки
    if (productTableRef.current && productTableRef.current.hasEditingRows()) {
      setEditWarning(true);
      return;
    }

    // Обновление продуктов в кэше и базе данных
    const updatedProducts = await updateCacheAndFirebase(products);

    const newStatus = checkCompletion(updatedProducts)
      ? "Выполнена"
      : "В работе";
    const completionDate =
      newStatus === "Выполнена" ? new Date().toLocaleString() : null;

    setLoading(true);

    const updatedRequest = {
      ...request,
      executive: executive.value,
      items: updatedProducts,
      hasFile: files.length > 0,
      isEditing: false, // Разблокируем заявку
      editingBy: null,
      editingSince: null,
      statusRequest: newStatus,
      completionDate: completionDate,
    };

    try {
      const requestRef = ref(database, `requests/${request.id}`);
      await update(requestRef, updatedRequest);

      setSuccessMessage(`Заявка ${request.number} успешно обновлена!`);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Ошибка при обновлении заявки:", error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (products.length > 0 || files.length > 0) {
      setShowWarning(true);
    } else {
      unlockRequestAndClose();
    }
  };

  const unlockRequestAndClose = async () => {
    setClosing(true);
    if (request) {
      const requestRef = ref(database, `requests/${request.id}`);
      await update(requestRef, {
        isEditing: false,
        editingBy: null,
        editingSince: null,
      });
    }
    setTimeout(onClose, 500);
  };

  const confirmClose = () => {
    unlockRequestAndClose();
  };

  const handleFilesCompressed = (compressedFiles) => {
    setFiles(compressedFiles);
  };

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

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (request && request.id) {
        unlockRequestAndClose();
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [request]);

  if (!request) {
    return null; // или показать какой-то индикатор загрузки/ошибки
  }

  return (
    <div className={`modal-overlay ${closing ? "fade-out" : ""}`}>
      <div
        className={`create-requests-modal-content ${
          closing ? "fade-out" : "fade-in"
        }`}
      >
        <div className="create-requests-modal-header">
          <h2>Редактирование заявки № {request.number}</h2>
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
          <ProductForm
            addProduct={addProduct}
            setError={setError}
            setStatus={setStatus}
          />
        </form>
        <div className="product-table-container">
          <ProductTable
            ref={productTableRef}
            products={products}
            setProducts={setProducts}
            setStatus={setStatus}
          />
        </div>
        <div className="create-requests-modal-footer">
          {documentsLoading ? (
            <div>Загрузка документов...</div>
          ) : documents.length > 0 ? (
            <div className="attached-files">
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
            </div>
          ) : (
            <FileUploader onFilesCompressed={handleFilesCompressed} />
          )}
          <button
            type="submit"
            className="submit-request-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Обновление..." : "Обновить заявку"}
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
        {editWarning && (
          <div className="warning-overlay">
            <div className="warning-content">
              <p>
                У вас есть товары в режиме редактирования. Пожалуйста, сохраните
                или отмените изменения перед обновлением заявки.
              </p>
              <button
                onClick={() => setEditWarning(false)}
                className="confirm-button"
              >
                Понял
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

export default EditRequestModal;
