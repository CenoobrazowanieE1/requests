import React from "react";
import Select from "react-select";
import makeAnimated from "react-select/animated";

const animatedComponents = makeAnimated();

const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder,
  isClearable,
  className,
}) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      fontSize: "13px",
      borderRadius: "10px",
      backgroundColor: state.isFocused
        ? "var(--color-secondary-light)"
        : "var(--color-primary-light)",
      boxShadow: "none",
      animation: " 0.3s ease",
      borderColor: state.isFocused
        ? "var(--color-highlight-dark)"
        : "var(--color-primary-light)",
      "&:hover": {
        borderColor: "transporent",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--color-secondary-dark)",
      fontSize: "10px",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--color-secondary-dark)",
      fontSize: "13px",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "var(--color-primary-light)"
        : "var(--color-background)",
      fontSize: "13px",
      padding: "5px",
      animation: " 0.3s ease",
      color: "var(--color-text-dark)",
      "&:hover": {
        backgroundColor: "var(--color-input-bg)",
        color: "var(--color-primary-dark)",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "10px",
      overflowY: "scroll",
      border: "none",
      animation: " 0.3s ease",
      backgroundColor: "var(--color-background)",
    }),
    menuList: (provided) => ({
      ...provided,
      padding: 0,
      border: "none",
      animation: " 0.3s ease",
      backgroundColor: "var(--color-background)",
    }),
  };

  return (
    <Select
      components={animatedComponents}
      styles={customStyles}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isClearable={isClearable}
      className={className}
    />
  );
};

export default CustomSelect;
