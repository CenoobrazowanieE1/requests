import React, { useState } from "react";
import { ref, set, remove } from "firebase/database";
import { database } from "./firebase";
import "./DeleteRequestModal.css";

const DeleteRequestModal = ({ requests, onClose, currentUser }) => {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!comment.trim()) {
      setError("Пожалуйста, укажите причину удаления.");
      return;
    }

    const deleteTime = new Date().toLocaleString();

    try {
      for (const request of requests) {
        // Сначала создаем новую запись в узле удаленных заявок
        const deletedRequestRef = ref(
          database,
          `deletedRequests/${request.id}`
        );
        await set(deletedRequestRef, {
          ...request,
          deletedBy: currentUser.fullName,
          deletedAt: deleteTime,
          deleteComment: comment,
        });

        // Затем удаляем заявку из узла заявок
        const requestRef = ref(database, `requests/${request.id}`);
        await remove(requestRef);
      }

      onClose();
    } catch (error) {
      console.error("Ошибка при удалении заявки:", error);
      setError("Ошибка при удалении заявки.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="delete-request-modal">
        <h2>Удаление заявок</h2>
        <textarea
          placeholder="Укажите причину удаления"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error && <p className="error-message">{error}</p>}
        <div className="modal-actions">
          <button onClick={onClose}>Отмена</button>
          <button onClick={handleDelete} disabled={!comment.trim()}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteRequestModal;
