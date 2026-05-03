import React, { useState, useEffect, useMemo } from "react";
import "./DataGrid.css";

export interface Column<T = any> {
  key: keyof T & string;
  label: string;
  widthClass?: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataGridProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
}

function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found.",
  pageSize = 10,
}: DataGridProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter
  const filtered = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) =>
        String(row[col.key] ?? "").toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, data, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key && prev.direction === "asc") return { key, direction: "desc" };
      return { key, direction: "asc" };
    });
  };

  return (
    <div className="datagrid-container">
      {/* Toolbar */}
      <div className="datagrid-toolbar">
        <span className="datagrid-count">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        <input
          type="text"
          className="datagrid-search"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="datagrid-table-wrapper">
        <table className="datagrid">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                return (
                  <th
                    key={col.key}
                    className={`${col.widthClass ?? ""} ${isSortable ? "sortable" : ""}`}
                    onClick={() => isSortable && handleSort(col.key)}
                  >
                    {col.label}
                    {sortConfig?.key === col.key && (
                      <span className="sort-icon">{sortConfig.direction === "asc" ? " ▲" : " ▼"}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="datagrid-status">Loading...</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="datagrid-status">{emptyMessage}</td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.widthClass}>
                      {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="datagrid-pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            ← Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default DataGrid;
