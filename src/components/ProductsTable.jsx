// ProductsTable.jsx
import React, { useMemo, useEffect, useState } from "react";
import {
  useTable,
  usePagination,
  useFilters,
  useSortBy,
  useGlobalFilter,
} from "react-table";
import { ref, onValue } from "firebase/database";
import { database } from "./firebase";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import MultiSelectColumnFilter from "./MultiSelectColumnFilter"; // Импортируем фильтр
import "./ProductsTable.css";

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => (
  <input
    value={filterValue || ""}
    onChange={(e) => setFilter(e.target.value || undefined)}
    placeholder={`Поиск...`}
    className="column-filter-input"
  />
);

const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
  return (
    <span>
      <input
        value={globalFilter || ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Введите текст для поиска"
        className="input-products-search"
      />
    </span>
  );
};

const filterTypes = {
  multiSelect: (rows, id, filterValues) => {
    if (filterValues.length === 0) return rows;
    return rows.filter((row) => filterValues.includes(row.values[id]));
  },
};

const ProductsTable = () => {
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true); // Состояние загрузки

  useEffect(() => {
    const fetchData = async () => {
      const requestsRef = ref(database, "requests");
      onValue(requestsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const productsArray = [];
          Object.keys(data).forEach((requestId) => {
            const request = data[requestId];
            request.items.forEach((item) => {
              productsArray.push({
                requestId,
                number: request.number,
                initiator: request.initiator,
                executive: request.executive,
                ...item,
              });
            });
          });
          setProductsData(productsArray);
        } else {
          setProductsData([]);
        }
        setLoading(false); // Устанавливаем состояние загрузки в false после получения данных
      });
    };

    fetchData();
  }, []);

  const data = useMemo(() => productsData, [productsData]);

  const columns = useMemo(
    () => [
      {
        Header: "Номер заявки",
        accessor: "number",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
      {
        Header: "Инициатор",
        accessor: "initiator",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
      {
        Header: "Исполнитель",
        accessor: "executive",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
      {
        Header: "Категория",
        accessor: "category",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
      {
        Header: "Код",
        accessor: "code",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
      {
        Header: "Название",
        accessor: "name",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
      {
        Header: "Количество",
        accessor: "quantity",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
      {
        Header: "Баз.ед.",
        accessor: "baseUnit",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      defaultColumn: { Filter: DefaultColumnFilter },
      initialState: { pageSize: 10 },
      filterTypes,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const renderSortIcon = (column) => {
    if (column.isSorted) {
      if (column.isSortedDesc) {
        return <FaSortDown />;
      } else {
        return <FaSortUp />;
      }
    } else {
      return <FaSort />;
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>; // Экран загрузки
  }

  return (
    <div className="products-table-container">
      <div className="table-controls">
        <GlobalFilter
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
        <div className="pagination">
          <button onClick={() => previousPage()} disabled={!canPreviousPage}>
            {"<"}
          </button>
          <button onClick={() => nextPage()} disabled={!canNextPage}>
            {">"}
          </button>
          <span>
            Страница{" "}
            <strong>
              {pageIndex + 1} из {pageOptions.length}
            </strong>{" "}
          </span>
          <span>
            | Перейти на страницу:{" "}
            <input
              type="number"
              defaultValue={pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                gotoPage(page);
              }}
              style={{ width: "100px" }}
            />
          </span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Показать {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
      <table className="products-table" {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>
                  <div>
                    {column.render("Header")}
                    <span
                      {...column.getSortByToggleProps({ title: "Сортировать" })}
                      onClick={(e) => {
                        e.stopPropagation();
                        column.toggleSortBy(!column.isSortedDesc);
                      }}
                      style={{ marginLeft: "5px", cursor: "pointer" }}
                    >
                      {renderSortIcon(column)}
                    </span>
                  </div>
                  <div>{column.canFilter ? column.render("Filter") : null}</div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
