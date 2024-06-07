import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./ColumnToggleMenu.css";

const ColumnToggleMenu = ({ columns, visibleColumns, handleToggleColumn }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectAll = () => {
    if (visibleColumns.length === columns.length) {
      setMenuOpen(false);
      columns.forEach((column) => handleToggleColumn(column.key));
    } else {
      columns.forEach((column) => {
        if (!visibleColumns.includes(column.key)) {
          handleToggleColumn(column.key);
        }
      });
    }
  };

  return (
    <div className="column-toggle-menu" ref={menuRef}>
      <button className="toggle-menu-button" onClick={toggleMenu}>
        {menuOpen ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {menuOpen && (
        <div className="menu-content">
          <button className="select-all-button" onClick={handleSelectAll}>
            {visibleColumns.length === columns.length
              ? "Снять все"
              : "Выбрать все"}
          </button>
          {columns.map((column) => (
            <label key={column.key} className="custom-checkbox">
              <input
                type="checkbox"
                checked={visibleColumns.includes(column.key)}
                onChange={() => handleToggleColumn(column.key)}
              />
              <span className="checkmark"></span>
              {column.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColumnToggleMenu;
