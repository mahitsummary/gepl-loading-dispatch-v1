'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Loader } from 'lucide-react';

const DataTable = ({
  columns,
  data = [],
  isLoading = false,
  searchable = true,
  searchableFields = [],
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick = null,
  emptyMessage = 'No data available',
  rowClassName = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || searchableFields.length === 0) return data;

    return data.filter((row) =>
      searchableFields.some((field) =>
        String(row[field])
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, searchableFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
      {/* Search bar */}
      {searchable && searchableFields.length > 0 && (
        <div className="p-4 border-b border-secondary-200 bg-secondary-50">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-500"
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-100 border-b border-secondary-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`px-6 py-3 text-left text-sm font-semibold text-secondary-700 ${
                    sortable && !column.disableSort
                      ? 'cursor-pointer hover:bg-secondary-200'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {sortable &&
                      !column.disableSort &&
                      sortConfig.key === column.key && (
                        <>
                          {sortConfig.direction === 'asc' ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </>
                      )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-secondary-200 hover:bg-secondary-50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClassName}`}
                >
                  {columns.map((column) => (
                    <td
                      key={`${index}-${column.key}`}
                      className="px-6 py-4 text-sm text-secondary-900"
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-secondary-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-200 bg-secondary-50">
          <p className="text-sm text-secondary-600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-secondary-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-100 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum =
                currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded-lg text-sm transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-secondary-300 hover:bg-secondary-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-secondary-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-100 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
