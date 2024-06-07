import React from "react";
import Select from "react-select";
import makeAnimated from "react-select/animated";

const animatedComponents = makeAnimated();

const MultiSelectColumnFilter = ({
  column: { filterValue = [], setFilter, preFilteredRows, id },
}) => {
  const options = React.useMemo(() => {
    const optionsSet = new Set();
    preFilteredRows.forEach((row) => {
      optionsSet.add(row.values[id]);
    });
    return [...optionsSet.values()].map((value) => ({ value, label: value }));
  }, [id, preFilteredRows]);

  const handleChange = (selectedOptions) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((option) => option.value)
      : [];
    setFilter(selectedValues.length ? selectedValues : undefined);
  };

  return (
    <Select
      isMulti
      components={animatedComponents}
      value={options.filter((option) => filterValue.includes(option.value))}
      onChange={handleChange}
      options={options}
      className="multi-select-filter"
      placeholder="Выберите..."
    />
  );
};

export default MultiSelectColumnFilter;
