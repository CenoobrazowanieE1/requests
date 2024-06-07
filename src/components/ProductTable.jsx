import React, { useState, forwardRef, useImperativeHandle, memo } from "react";
import { FaLink, FaEdit, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import ColumnToggleMenu from "./ColumnToggleMenu";
import NotificationPopup from "./NotificationPopup";
import Select from "react-select";
import "./ProductTable.css";

const columns = [
  { key: "category", label: "Категория" },
  { key: "name", label: "Наименование" },
  { key: "variation", label: "Вариант исп." },
  { key: "baseUnit", label: "Базовая единица" },
  { key: "equipment", label: "Оборудование" },
  { key: "supplier", label: "Поставщик" },
  { key: "code", label: "Код" },
  { key: "quantity", label: "Кол-во" },
  { key: "link", label: "Ссылка" },
  { key: "comment", label: "Комментарий" },
  { key: "documentNumber", label: "Номер документа" },
  { key: "status", label: "Статус товара" },
  { key: "receiptDate", label: "Дата поступления" },
];

const statusOptions = [
  { value: "В работе", label: "В работе" },
  { value: "Выполнена", label: "Выполнена" },
  { value: "Отменена", label: "Отменена" },
];

const ProductTable = forwardRef(({ products, setProducts, setStatus }, ref) => {
  const [editingIndices, setEditingIndices] = useState(new Set());
  const [editedProducts, setEditedProducts] = useState({});
  const [originalProducts, setOriginalProducts] = useState({});
  const [visibleColumns, setVisibleColumns] = useState(
    columns.map((column) => column.key)
  );
  const [notification, setNotification] = useState("");
  const [editAll, setEditAll] = useState(false);

  useImperativeHandle(ref, () => ({
    hasEditingRows: () => editingIndices.size > 0,
  }));

  const handleEditAllToggle = () => {
    if (editAll) {
      handleSaveAll();
    } else {
      setEditAll(true);
      const newEditingIndices = new Set(products.map((_, i) => i));
      setEditingIndices(newEditingIndices);
      const newEditedProducts = {};
      const newOriginalProducts = {};
      products.forEach((product, i) => {
        newEditedProducts[i] = { ...product };
        newOriginalProducts[i] = { ...product };
      });
      setEditedProducts(newEditedProducts);
      setOriginalProducts(newOriginalProducts);
    }
  };

  const handleSaveAll = () => {
    const updatedProducts = products.map((product, index) =>
      editingIndices.has(index) ? formatProduct(editedProducts[index]) : product
    );

    const invalidProducts = updatedProducts.filter(
      (product) =>
        (product.status === "Выполнена" && !product.documentNumber) ||
        (product.status === "Отменена" && !product.comment)
    );

    if (invalidProducts.length > 0) {
      setNotification(
        "Проверьте, что у всех товаров со статусом 'Выполнена' указан номер документа, а у товаров со статусом 'Отменена' указана причина."
      );
      return;
    }

    setProducts(updatedProducts);
    setEditAll(false);
    setEditingIndices(new Set());
    setEditedProducts({});
    setOriginalProducts({});
    updateStatus(updatedProducts);
  };

  const handleEdit = (index) => {
    setEditingIndices(new Set([...editingIndices, index]));
    setEditedProducts({
      ...editedProducts,
      [index]: { ...products[index] },
    });
    setOriginalProducts({
      ...originalProducts,
      [index]: { ...products[index] },
    });
  };

  const handleSave = (index) => {
    const product = editedProducts[index];
    if (product.status === "Выполнена" && !product.documentNumber) {
      setNotification(
        `Для выполнения товара требуется указать номер документа для товара ${product.name}`
      );
      return;
    }
    if (product.status === "Отменена" && !product.comment) {
      setNotification(
        `Для отмены товара требуется указать причину для товара ${product.name}`
      );
      return;
    }
    const updatedProducts = products.map((product, i) =>
      i === index ? formatProduct(editedProducts[index]) : product
    );
    setProducts(updatedProducts);
    const newEditingIndices = new Set(editingIndices);
    newEditingIndices.delete(index);
    setEditingIndices(newEditingIndices);
    const newEditedProducts = { ...editedProducts };
    delete newEditedProducts[index];
    setEditedProducts(newEditedProducts);
    const newOriginalProducts = { ...originalProducts };
    delete newOriginalProducts[index];
    setOriginalProducts(newOriginalProducts);
    setEditAll(false);
    updateStatus(updatedProducts);
  };

  const handleCancel = (index) => {
    const newEditingIndices = new Set(editingIndices);
    newEditingIndices.delete(index);
    setEditingIndices(newEditingIndices);
    const newEditedProducts = { ...editedProducts };
    delete newEditedProducts[index];
    setEditedProducts(newEditedProducts);
    setProducts(
      products.map((product, i) =>
        i === index ? originalProducts[index] : product
      )
    );
    const newOriginalProducts = { ...originalProducts };
    delete newOriginalProducts[index];
    setOriginalProducts(newOriginalProducts);
  };

  const handleDelete = (index) => {
    const confirmDelete = window.confirm(
      "Вы уверены, что хотите удалить этот товар?"
    );
    if (confirmDelete) {
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
      const newEditingIndices = new Set(editingIndices);
      newEditingIndices.delete(index);
      setEditingIndices(newEditingIndices);
      const newEditedProducts = { ...editedProducts };
      delete newEditedProducts[index];
      setEditedProducts(newEditedProducts);
      updateStatus(updatedProducts);
    }
  };

  const handleBlur = (e, index, field) => {
    if (e.relatedTarget && e.relatedTarget.tagName === "A") {
      return; // Если целевой элемент это ссылка, не делаем ничего
    }
    const updatedProducts = [...products];
    updatedProducts[index][field] = e.target.textContent;
    setProducts(updatedProducts);
  };

  const preventHtmlInsertion = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  const handleChange = (e, field, index) => {
    let { textContent } = e.target;

    if (field === "code") {
      // Удаляем все не числовые символы
      textContent = textContent.replace(/\D/g, "");

      if (textContent.length > 5) {
        setNotification(
          "Код должен быть числовым и содержать не более 5 символов."
        );
        e.target.textContent = ""; // Очистить ячейку
        return;
      }
    }

    setEditedProducts({
      ...editedProducts,
      [index]: { ...editedProducts[index], [field]: textContent },
    });
  };

  const formatText = (text) => {
    if (typeof text !== "string") return text;
    return text.trim().replace(/\s+/g, " ");
  };

  const formatProduct = (product) => {
    if (!product) return product;
    const formattedProduct = {};
    Object.keys(product).forEach((key) => {
      formattedProduct[key] = formatText(product[key]);
    });
    return formattedProduct;
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    window.open(e.target.closest("a").href, "_blank");
  };

  const handleToggleColumn = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const updateStatus = (products) => {
    const newStatus = products.every(
      (product) =>
        product.status === "Выполнена" || product.status === "Отменена"
    )
      ? "Выполнена"
      : "В работе";
    if (setStatus) {
      setStatus(newStatus);
    }
  };

  const handleStatusChange = (selectedOption, index) => {
    const newStatus = selectedOption.value;
    const updatedProducts = [...products];
    updatedProducts[index].status = newStatus;
    setProducts(updatedProducts);
    const newEditedProducts = { ...editedProducts };
    newEditedProducts[index].status = newStatus;
    setEditedProducts(newEditedProducts);
  };

  const handleSetAllStatus = (selectedOption) => {
    const newStatus = selectedOption.value;

    // Проверяем условия перед обновлением статуса для всех товаров
    if (newStatus === "Выполнена") {
      const invalidProducts = products.filter(
        (product) => !product.documentNumber
      );
      if (invalidProducts.length > 0) {
        setNotification(
          "Для выполнения всех товаров требуется указать номер документа."
        );
        return;
      }
    } else if (newStatus === "Отменена") {
      const invalidProducts = products.filter((product) => !product.comment);
      if (invalidProducts.length > 0) {
        setNotification("Для отмены всех товаров требуется указать причину.");
        return;
      }
    }

    const updatedProducts = products.map((product) => ({
      ...product,
      status: newStatus,
    }));
    setProducts(updatedProducts);
    if (editAll) {
      const newEditedProducts = {};
      updatedProducts.forEach((product, i) => {
        newEditedProducts[i] = { ...product };
      });
      setEditedProducts(newEditedProducts);
    }
  };

  const customStyles = {
    control: (provided) => ({
      ...provided,
      minWidth: "130px",
      fontSize: "13px",
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
  };

  return (
    <div>
      <div className="table-controls-product">
        <ColumnToggleMenu
          columns={columns}
          visibleColumns={visibleColumns}
          handleToggleColumn={handleToggleColumn}
        />
        <label className="custom-checkbox">
          <input
            type="checkbox"
            checked={editAll}
            onChange={handleEditAllToggle}
          />
          <span className="checkmark"></span>
          Редактировать все
        </label>
        <div className="set-all-status">
          <Select
            options={statusOptions}
            onChange={handleSetAllStatus}
            placeholder="Установить статус всем"
            className="status-dropdown"
            menuPlacement="auto"
            menuPortalTarget={document.body}
            styles={customStyles}
          />
        </div>
      </div>
      <table className="product-table">
        <thead>
          <tr>
            <th>#</th>
            {columns
              .filter((column) => visibleColumns.includes(column.key))
              .map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              {columns
                .filter((column) => visibleColumns.includes(column.key))
                .map((column) => (
                  <td
                    key={column.key}
                    data-index={index}
                    data-field={column.key}
                    className={
                      (column.key === "documentNumber" &&
                        product.status === "Выполнена" &&
                        !product.documentNumber) ||
                      (column.key === "comment" &&
                        product.status === "Отменена" &&
                        !product.comment)
                        ? "error-cell"
                        : column.key === "link"
                        ? "link-cell"
                        : ""
                    }
                    contentEditable={
                      column.key !== "status" &&
                      (editAll || editingIndices.has(index))
                    }
                    suppressContentEditableWarning={true}
                    onBlur={(e) => handleBlur(e, index, column.key)}
                    onPaste={preventHtmlInsertion}
                    onInput={(e) => handleChange(e, column.key, index)}
                  >
                    {column.key === "link" &&
                    !(editAll || editingIndices.has(index)) ? (
                      product[column.key] ? (
                        <a
                          href={product[column.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleLinkClick}
                        >
                          <FaLink />
                        </a>
                      ) : (
                        ""
                      )
                    ) : column.key === "status" ? (
                      editAll || editingIndices.has(index) ? (
                        <Select
                          placeholder="Выбрать статус"
                          value={statusOptions.find(
                            (option) =>
                              option.value ===
                              (editedProducts[index]?.status || product.status)
                          )}
                          onChange={(selectedOption) =>
                            handleStatusChange(selectedOption, index)
                          }
                          options={statusOptions}
                          className="status-dropdown"
                          menuPlacement="auto"
                          menuPortalTarget={document.body}
                          styles={customStyles}
                        />
                      ) : (
                        product.status
                      )
                    ) : (
                      product[column.key]
                    )}
                  </td>
                ))}
              <td>
                {editingIndices.has(index) ? (
                  <div className="action-icons">
                    <button
                      className="button-product-save"
                      onClick={() => handleSave(index)}
                      title="Сохранить"
                    >
                      <FaSave />
                    </button>
                    <button
                      className="button-product-cancel"
                      onClick={() => handleCancel(index)}
                      title="Отмена"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="action-icons">
                    <button
                      className="button-product-edit"
                      onClick={() => handleEdit(index)}
                      title="Изменить"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="button-product-delete"
                      onClick={() => handleDelete(index)}
                      title="Удалить"
                    >
                      <FaTrash />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {notification && (
        <NotificationPopup
          message={notification}
          onClose={() => setNotification("")}
        />
      )}
    </div>
  );
});

export default ProductTable;
