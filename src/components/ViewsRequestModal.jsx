import React, { useEffect, useRef } from "react";
import "./ViewsRequestModal.css";
import AttachedFiles from "./AttachedFiles";

const ViewsRequestModal = ({ request, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="views-modal-content views-modal-open" ref={modalRef}>
      <div className="views-modal-header">
        <h2>Детали заявки № {request.number}</h2>
        <button className="views-modal-close" onClick={onClose}>
          Закрыть
        </button>
      </div>
      <div className="views-modal-info">
        <div className="views-modal-info-data">
          <p>
            <strong>Дата создания:</strong> {request.date}
          </p>
          <p>
            <strong>Дата выполнения:</strong> {request.completionDate}
          </p>
        </div>
        <p>
          <strong>Инициатор:</strong> {request.initiator}
        </p>
        <p>
          <strong>Исполнитель:</strong> {request.executive}
        </p>
        <p>
          <strong>Статус:</strong> {request.statusRequest}
        </p>
      </div>
      <table className="views-mini-table">
        <thead>
          <tr>
            <th>Категория</th>
            <th>Код</th>
            <th>Название</th>
            <th>Количество</th>
            <th>Тип</th>
          </tr>
        </thead>
        <tbody>
          {request.items.map((item, index) => (
            <tr key={index}>
              <td>{item.category}</td>
              <td>{item.code}</td>
              <td>{item.name}</td>
              <td>{item.count}</td>
              <td>{item.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <AttachedFiles requestId={request.id} />
    </div>
  );
};

export default ViewsRequestModal;
