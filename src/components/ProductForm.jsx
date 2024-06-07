import React, { useState, useEffect, useRef } from "react";
import CustomSelect from "./CustomSelect";
import AutoCompleteInput from "./AutoComplete";
import MiniSearch from "minisearch";
import "./ProductForm.css";
import localforage from "localforage";

const ProductForm = ({ addProduct, setError }) => {
  const [category, setCategory] = useState(null);
  const [name, setName] = useState("");
  const [variation, setVariation] = useState("осн.");
  const [baseUnit, setBaseUnit] = useState(null);
  const [equipment, setEquipment] = useState("");
  const [supplier, setSupplier] = useState("");
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [link, setLink] = useState("");
  const [comment, setComment] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [status, setStatus] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [baseUnits, setBaseUnits] = useState([]);
  const [touched, setTouched] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const miniSearchRef = useRef(null);

  useEffect(() => {
    const fetchBaseUnits = async () => {
      const baseUnitsList = [
        { value: "шт", label: "штука" },
        { value: "кг", label: "килограмм" },
        { value: "л", label: "литр" },
        { value: "м", label: "метр" },
        { value: "лист", label: "лист" },
        { value: "пог.м", label: "пог.метр" },
        { value: "кв.м", label: "кв.метр" },
      ];
      setBaseUnits(baseUnitsList);
    };

    const initializeMiniSearch = async () => {
      const items = await localforage.getItem("items");
      if (items) {
        const miniSearch = new MiniSearch({
          fields: ["name", "group3"],
          storeFields: ["name", "group3"],
        });
        miniSearch.addAll(items);
        miniSearchRef.current = miniSearch;
      }
    };

    fetchBaseUnits();
    initializeMiniSearch();
  }, []);

  const handleAddProduct = () => {
    const newTouched = {
      category: true,
      name: true,
      variation: true,
      baseUnit: true,
      quantity: true,
      equipment: category && category.value === "Запасные части",
    };

    setTouched(newTouched);

    if (
      !category ||
      !name ||
      !variation ||
      !baseUnit ||
      !quantity ||
      (category && category.value === "Запасные части" && !equipment)
    ) {
      setError("Пожалуйста, заполните все обязательные поля товара.");
      return;
    }

    const newProduct = {
      category: category.value,
      name,
      firstName: name,
      variation,
      baseUnit: baseUnit ? baseUnit.value : "",
      equipment,
      supplier,
      code:
        selectedItem &&
        (selectedItem.name !== name ||
          selectedItem.variation !== variation ||
          selectedItem.baseUnit !== (baseUnit ? baseUnit.value : ""))
          ? ""
          : code,
      quantity,
      link,
      comment,
      documentNumber,
      status,
      receiptDate,
    };

    addProduct(newProduct);
    setCategory(null);
    setName("");
    setVariation("осн.");
    setBaseUnit(null);
    setEquipment("");
    setSupplier("");
    setCode("");
    setQuantity("");
    setLink("");
    setComment("");
    setDocumentNumber("");
    setStatus("");
    setReceiptDate("");
    setError("");
    setTouched({});
    setSelectedItem(null);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setName(item.name);
    setVariation(item.variation);
    setBaseUnit({ value: item.baseUnit, label: item.baseUnit });
    setCode(item.code);
    setCategory({ value: item.group3, label: item.group3 });
  };

  const handleNameChange = (name) => {
    if (
      selectedItem &&
      (selectedItem.name !== name ||
        selectedItem.variation !== variation ||
        selectedItem.baseUnit !== (baseUnit ? baseUnit.value : ""))
    ) {
      setVariation("осн.");
      setBaseUnit(null);
      setCode("");
    }
    setName(name);

    if (!name) {
      setCategory(null);
      setCategoryOptions([]);
      return;
    }

    // Update categories based on the current name input
    if (miniSearchRef.current) {
      const results = miniSearchRef.current.search(name, { prefix: true });
      const uniqueCategories = [
        ...new Set(results.map((item) => item.group3)),
      ].slice(0, 10);
      setCategoryOptions(
        uniqueCategories.map((category) => ({
          value: category,
          label: category,
        }))
      );
    }
  };

  const handleFocus = (field) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  return (
    <div className="form-line">
      <div
        className={`form-group ${focusedField === "category" ? "focused" : ""}`}
        onFocus={() => handleFocus("category")}
        onBlur={handleBlur}
      >
        <label className={!category && touched.category ? "required" : ""}>
          Категория
        </label>
        <CustomSelect
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder="Выберите категорию"
          isClearable
          className={!category && touched.category ? "error" : ""}
        />
      </div>
      <div
        className={`form-group autocomplete-container ${
          focusedField === "name" ? "focused" : ""
        }`}
        onFocus={() => handleFocus("name")}
        onBlur={handleBlur}
      >
        <label className={!name && touched.name ? "required" : ""}>
          Наименование
        </label>
        <AutoCompleteInput
          value={name}
          onChange={handleNameChange}
          onSelect={handleSelectItem}
          className={!name && touched.name ? "error" : ""}
        />
      </div>
      <div
        className={`form-group ${
          focusedField === "variation" ? "focused" : ""
        }`}
        onFocus={() => handleFocus("variation")}
        onBlur={handleBlur}
      >
        <label className={!variation && touched.variation ? "required" : ""}>
          Вариант исп.
        </label>
        <input
          type="text"
          value={variation}
          onChange={(e) => setVariation(e.target.value)}
          className={!variation && touched.variation ? "error" : ""}
        />
      </div>
      <div
        className={`form-group input-baseUnit ${
          focusedField === "baseUnit" ? "focused" : ""
        }`}
        onFocus={() => handleFocus("baseUnit")}
        onBlur={handleBlur}
      >
        <label className={!baseUnit && touched.baseUnit ? "required" : ""}>
          Базовая ед.
        </label>
        <CustomSelect
          options={baseUnits}
          value={baseUnit}
          onChange={setBaseUnit}
          placeholder="Выберите баз.ед."
          isClearable
          className={!baseUnit && touched.baseUnit ? "error" : ""}
        />
      </div>
      <div
        className={`form-group ${
          category &&
          category.value === "Запасные части" &&
          !equipment &&
          touched.equipment
            ? "required"
            : ""
        } ${focusedField === "equipment" ? "focused" : ""}`}
        onFocus={() => handleFocus("equipment")}
        onBlur={handleBlur}
      >
        <label>Оборудование</label>
        <input
          type="text"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          className={
            category &&
            category.value === "Запасные части" &&
            !equipment &&
            touched.equipment
              ? "error"
              : ""
          }
        />
      </div>
      <div
        className={`form-group input-quantity ${
          focusedField === "quantity" ? "focused" : ""
        }`}
        onFocus={() => handleFocus("quantity")}
        onBlur={handleBlur}
      >
        <label className={!quantity && touched.quantity ? "required" : ""}>
          Кол-во
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className={!quantity && touched.quantity ? "error" : ""}
        />
      </div>
      <div
        className={`form-group ${focusedField === "link" ? "focused" : ""}`}
        onFocus={() => handleFocus("link")}
        onBlur={handleBlur}
      >
        <label>Ссылка на товар</label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="add-product-button"
        onClick={handleAddProduct}
      >
        Добавить
      </button>
    </div>
  );
};

export default ProductForm;
