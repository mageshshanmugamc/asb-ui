import React, { useState, useEffect, useMemo } from "react";
import "./DataGrid.css";

export interface Column<T = any> {
  key: keyof T & string;
  label: string;
  widthClass?: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string; // server-side sort key if different from `key` (e.g. "Id" vs "id")
}

export interface ServerQueryParams {
  skip: number;
  take: number;
  sortBy?: string;
  isDescending?: boolean;
}

interface DataGridProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  rowClassName?: (row: T) => string | undefined;
  // Server-side pagination/sorting (opt-in)
  totalCount?: number;
  onQueryChange?: (params: ServerQueryParams) => void;
}

function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data found.",
  pageSize = 10,
  rowClassName,
  totalCount,
  onQueryChange,
}: DataGridProps<T>) {
  const isServerSide = typeof totalCount === "number" && !!onQueryChange;

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Notify parent when page or sort changes (server-side mode)
  useEffect(() => {
    if (!isServerSide) return;
    const col = sortConfig ? columns.find((c) => c.key === sortConfig.key) : undefined;
    onQueryChange({
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      sortBy: col ? (col.sortKey ?? sortConfig!.key) : undefined,
      isDescending: sortConfig ? sortConfig.direction === "desc" : undefined,
    });
  }, [currentPage, sortConfig, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filter
  const filtered = useMemo(() => {
    if (isServerSide || !searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) =>
        String(row[col.key] ?? "").toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, data, columns, isServerSide]);

  // Client-side sort
  const sorted = useMemo(() => {
    if (isServerSide || !sortConfig) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortConfig, isServerSide]);

  // Paginate
  const serverTotalPages = isServerSide ? Math.max(1, Math.ceil(totalCount / pageSize)) : 0;
  const totalPages = isServerSide ? serverTotalPages : Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = isServerSide ? data : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const recordCount = isServerSide ? totalCount : filtered.length;

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
        <span className="datagrid-count">{recordCount} record{recordCount !== 1 ? "s" : ""}</span>
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
                <tr key={idx} className={rowClassName?.(row) || undefined}>
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
