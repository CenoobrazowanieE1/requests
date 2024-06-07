import React, { useState, useEffect, useMemo } from "react";
import {
  useTable,
  usePagination,
  useExpanded,
  useFilters,
  useSortBy,
  useGlobalFilter,
} from "react-table";
import { ref, onValue, get, update } from "firebase/database";
import { database } from "./firebase";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaCopy,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaPaperclip,
  FaLock,
  FaLockOpen,
} from "react-icons/fa";
import MultiSelectColumnFilter from "./MultiSelectColumnFilter";
import ViewsRequestModal from "./ViewsRequestModal";
import EditRequestModal from "./EditRequestModal";
import DeleteRequestModal from "./DeleteRequestModal";
import CopyRequestModal from "./CopyRequestModal"; // Новый импорт
import AttachedFiles from "./AttachedFiles";
import "./RequestTable.css";
import useCurrentUser from "./useCurrentUser"; // Используем хук для получения текущего пользователя

const DefaultColumnFilter = ({ column: { filterValue, setFilter } }) => (
  <input
    value={filterValue || ""}
    onChange={(e) => setFilter(e.target.value || undefined)}
    placeholder={`Поиск...`}
    className="column-filter-input"
    onClick={(e) => e.stopPropagation()}
    style={{ display: "none" }}
  />
);

const GlobalFilter = ({ globalFilter, setGlobalFilter }) => {
  return (
    <span className="container-requests-search">
      <input
        value={globalFilter || ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Введите текст для поиска"
        className="input-requests-search"
      />
      <FaSearch className="icon-search" />
    </span>
  );
};

const filterTypes = {
  multiSelect: (rows, id, filterValues) => {
    if (filterValues.length === 0) return rows;
    return rows.filter((row) => filterValues.includes(row.values[id]));
  },
};

const RequestTable = () => {
  const currentUser = useCurrentUser(); // Получаем текущего пользователя
  const [requests, setRequests] = useState([]);
  const [allSelected, setAllSelected] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false); // Новое состояние
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const saveTableState = (state) => {
    localStorage.setItem("tableState", JSON.stringify(state));
  };

  const loadTableState = () => {
    const savedState = localStorage.getItem("tableState");
    return savedState ? JSON.parse(savedState) : {};
  };

  useEffect(() => {
    const fetchData = async () => {
      const requestsRef = ref(database, "requests");
      onValue(requestsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRequests(
            Object.entries(data).map(([id, value]) => ({ id, ...value }))
          );
        } else {
          setRequests([]);
        }
        setLoading(false);
      });
    };

    fetchData();
  }, []);

  const handleEditClick = (row) => {
    const requestRef = ref(database, `requests/${row.original.id}`);

    get(requestRef)
      .then((snapshot) => {
        const request = snapshot.val();

        if (!request) {
          alert("Заявка не найдена или недоступна для редактирования.");
          return;
        }

        if (
          request.isEditing &&
          request.editingBy !== currentUser?.fullName &&
          !currentUser?.roles?.admin
        ) {
          alert(`Заявка уже редактируется пользователем ${request.editingBy}`);
        } else {
          const updatedRequest = {
            ...request,
            isEditing: true,
            editingBy: currentUser?.fullName || "Неизвестный пользователь",
            editingSince: Date.now(),
          };

          update(requestRef, updatedRequest).then(() => {
            setSelectedRequests([row.original]);
            setEditModalOpen(true);
          });
        }
      })
      .catch((error) => {
        console.error("Ошибка при получении данных заявки:", error);
        alert("Произошла ошибка при получении данных заявки.");
      });
  };

  const handleDeleteClick = () => {
    const selectedRequestObjects = selectedRows.map(
      (rowIndex) => requests[rowIndex]
    );
    const canDelete = selectedRequestObjects.every(
      (req) =>
        currentUser?.roles?.admin || req.initiator === currentUser?.fullName
    );

    if (canDelete) {
      setSelectedRequests(selectedRequestObjects);
      setDeleteModalOpen(true);
    } else {
      alert("У вас нет прав на удаление некоторых заявок.");
    }
  };

  const handleDeleteSingleRequest = (request) => {
    if (
      currentUser?.roles?.admin ||
      request.initiator === currentUser?.fullName
    ) {
      setSelectedRequests([request]);
      setDeleteModalOpen(true);
    } else {
      alert("У вас нет прав на удаление этой заявки.");
    }
  };

  const handleCopyRequest = (request) => {
    setSelectedRequests([request]);
    setCopyModalOpen(true);
  };

  const data = useMemo(() => requests, [requests]);

  const columns = useMemo(
    () => [
      {
        Header: (
          <label className="custom-checkbox">
            <input
              type="checkbox"
              onChange={() => {
                const newAllSelected = !allSelected;
                setAllSelected(newAllSelected);
                setSelectedRows(
                  newAllSelected ? requests.map((_, index) => index) : []
                );
              }}
              checked={allSelected}
            />
            <span className="checkmark"></span>
          </label>
        ),
        accessor: "selection",
        disableFilters: true,
        disableSortBy: true,
        minWidth: 50,
        Cell: ({ row }) => (
          <label className="custom-checkbox">
            <input
              type="checkbox"
              className="request-table-checkbox"
              checked={selectedRows.includes(row.index)}
              onChange={() => {
                const newSelectedRows = selectedRows.includes(row.index)
                  ? selectedRows.filter((index) => index !== row.index)
                  : [...selectedRows, row.index];
                setSelectedRows(newSelectedRows);
                setAllSelected(newSelectedRows.length === requests.length);
              }}
            />
            <span className="checkmark"></span>
          </label>
        ),
      },
      {
        Header: "Номер",
        accessor: "number",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
        minWidth: 50,
        className: "filter-box",
      },
      {
        Header: "Дата создания",
        accessor: "date",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
        minWidth: 100,
        className: "filter-box",
      },
      {
        Header: "Инициатор",
        accessor: "initiator",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
        minWidth: 150,
        className: "filter-box",
      },
      {
        Header: "Исполнитель",
        accessor: "executive",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
        minWidth: 150,
        className: "filter-box",
      },
      {
        Header: "Статус",
        accessor: "statusRequest",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
        minWidth: 100,
        className: "filter-box",
      },
      {
        Header: "Дата выполнения",
        accessor: "completionDate",
        Filter: MultiSelectColumnFilter,
        filter: "multiSelect",
        minWidth: 100,
        className: "filter-box",
      },
      {
        Header: "Продукты",
        accessor: "products",
        disableFilters: true,
        disableSortBy: true,
        minWidth: 150,
        className: "filter-box",
        Cell: ({ row }) => {
          const totalProducts = row.original.items.length;
          const productsWithCode = row.original.items.filter(
            (item) => item.code
          ).length;
          const color = totalProducts === productsWithCode ? "green" : "red";
          return (
            <div style={{ color }}>
              {totalProducts}/{productsWithCode}
            </div>
          );
        },
      },
      {
        Header: "Документы",
        accessor: "hasFile",
        disableFilters: true,
        disableSortBy: true,
        minWidth: 50,
        className: "filter-box",
        Cell: ({ row }) => (
          <div style={{ textAlign: "center", position: "relative" }}>
            {row.original.hasFile ? (
              <div className="file-icon-wrapper">
                <FaPaperclip />
                <span className="file-download-tooltip">
                  {/* <AttachedFiles requestId={row.original.id} /> */}
                </span>
              </div>
            ) : null}
          </div>
        ),
      },
      {
        Header: "Блокировка",
        accessor: "isEditing",
        disableFilters: true,
        disableSortBy: true,
        minWidth: 50,
        className: "filter-box",
        Cell: ({ row }) => (
          <div style={{ textAlign: "center", position: "relative" }}>
            {row.original.isEditing ? <FaLock /> : <FaLockOpen />}
          </div>
        ),
      },
      {
        Header: "Действия",
        accessor: "actions",
        disableFilters: true,
        disableSortBy: true,
        minWidth: 100,
        className: "filter-box",
        Cell: ({ row }) => (
          <div className="action-icons" id={`actions-${row.id}`}>
            <div className="icon-wrapper">
              <FaEye
                className="action-icon"
                onClick={() => {
                  setSelectedRequests([row.original]);
                  setModalOpen(true);
                }}
              />
              <span className="icon-tooltip">Просмотр</span>
            </div>
            <div className="icon-wrapper" onClick={() => handleEditClick(row)}>
              <FaEdit className="action-icon" />
              <span className="icon-tooltip">Редактирование</span>
            </div>
            <div
              className="icon-wrapper"
              onClick={() => handleCopyRequest(row.original)}
            >
              <FaCopy className="action-icon" />
              <span className="icon-tooltip">Копировать</span>
            </div>
            <div
              className="icon-wrapper"
              onClick={() => handleDeleteSingleRequest(row.original)}
            >
              <FaTrash className="action-icon" />
              <span className="icon-tooltip">Удаление</span>
            </div>
          </div>
        ),
      },
    ],
    [allSelected, selectedRows, requests, currentUser] // Добавляем currentUser как зависимость
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
    state: { pageIndex, pageSize, filters, sortBy, globalFilter },
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      defaultColumn: { Filter: DefaultColumnFilter },
      initialState: loadTableState(),
      filterTypes,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    useExpanded,
    usePagination
  );

  useEffect(() => {
    saveTableState({ filters, sortBy, pageSize });
  }, [filters, sortBy, pageSize]);

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
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="request-table-container">
      <div className="table-controls">
        <div className="action-controls">
          <button onClick={handleDeleteClick}>
            <FaTrash className="action-icon" />
            Удалить
          </button>
          <button>
            <FaDownload className="action-icon" />
            Скачать
          </button>
          <button>
            <FaCopy className="action-icon" />
            Копировать
          </button>
        </div>
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
      <table className="request-table" {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>
                  <div>
                    {column.render("Header")}
                    {!["selection", "actions", "products", "hasFile"].includes(
                      column.id
                    ) && (
                      <span
                        {...column.getSortByToggleProps({
                          title: "Сортировать",
                        })}
                        onClick={(e) => {
                          e.stopPropagation();
                          column.toggleSortBy(!column.isSortedDesc);
                        }}
                        style={{ marginLeft: "5px", cursor: "pointer" }}
                      >
                        {renderSortIcon(column)}
                      </span>
                    )}
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
              <React.Fragment key={row.id}>
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell) => (
                    <td
                      {...cell.getCellProps({
                        id: `${cell.column.id}-${row.id}`,
                      })}
                    >
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {modalOpen && selectedRequests.length === 1 && (
        <ViewsRequestModal
          request={selectedRequests[0]}
          onClose={() => setModalOpen(false)}
        />
      )}

      {editModalOpen && selectedRequests.length === 1 && (
        <EditRequestModal
          request={selectedRequests[0]}
          onClose={() => setEditModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {deleteModalOpen && (
        <DeleteRequestModal
          requests={selectedRequests}
          onClose={() => setDeleteModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {copyModalOpen && selectedRequests.length === 1 && (
        <CopyRequestModal
          request={selectedRequests[0]}
          onClose={() => setCopyModalOpen(false)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default RequestTable;
