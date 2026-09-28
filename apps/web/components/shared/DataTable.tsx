import React, { useState } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Skeleton
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DownloadIcon from '@mui/icons-material/Download';
import { Button, Tooltip } from '@mui/material';
import * as XLSX from 'xlsx';

const premiumShadow = '0px 2px 4px rgba(0,0,0,0.04), 0px 4px 6px rgba(0,0,0,0.02)';

export type ColumnDef<T> = {
  id: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  title?: string;
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  exportable?: boolean;
  exportFilename?: string;
  actionMenu?: React.ReactNode;
  serverPagination?: {
    total: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (newPage: number) => void;
    onRowsPerPageChange?: (newRowsPerPage: number) => void;
  };
};

export default function DataTable<T extends { id?: string | number }>({
  title,
  columns,
  data,
  loading = false,
  emptyIcon = <StorageIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 2 }} />,
  emptyMessage = 'No data found',
  exportable = true,
  exportFilename = 'export.xlsx',
  actionMenu,
  serverPagination
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(0);
  const [clientRowsPerPage, setClientRowsPerPage] = useState(10);

  
  const handleExport = () => {
    // We only export stringifiable raw data
    const exportData = data.map((row: any) => {
      const cleanRow: any = {};
      columns.forEach(col => {
        let val = row[col.id];
        // If it's an object/array, stringify it
        if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
        }
        cleanRow[col.label] = val;
      });
      return cleanRow;
    });
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, exportFilename);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    if (serverPagination) {
      serverPagination.onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRows = parseInt(event.target.value, 10);
    if (serverPagination) {
      if (serverPagination.onRowsPerPageChange) serverPagination.onRowsPerPageChange(newRows);
    } else {
      setClientRowsPerPage(newRows);
      setClientPage(0);
    }
  };

  const paginatedData = serverPagination 
    ? data 
    : data.slice(clientPage * clientRowsPerPage, clientPage * clientRowsPerPage + clientRowsPerPage);

  const currentPage = serverPagination ? serverPagination.page : clientPage;
  const currentRowsPerPage = serverPagination ? serverPagination.rowsPerPage : clientRowsPerPage;
  const currentTotal = serverPagination ? serverPagination.total : data.length;

  return (
    <Box>
      
      {(title || actionMenu || exportable) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2, pt: 2 }}>
          <Box>
            {title && (
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', letterSpacing: 1, textTransform: 'uppercase' }}>
                {title}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {exportable && data.length > 0 && !loading && (
              <Tooltip title="Export to Excel">
                <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#E5E7EB', color: '#6B7280', '&:hover': { bgcolor: '#F9FAFB' } }}>
                  Export
                </Button>
              </Tooltip>
            )}
            {actionMenu && <Box>{actionMenu}</Box>}
          </Box>
        </Box>
      )}


      <Box sx={{ overflow: 'hidden', borderTop: (title || actionMenu || exportable) ? '1px solid #E5E7EB' : 'none' }}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id} align={col.align || 'left'} sx={{ fontWeight: 700, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(5)).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((col, cIdx) => (
                      <TableCell key={cIdx} align={col.align || 'left'}><Skeleton height={24} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                    {emptyIcon}
                    <Typography sx={{ color: '#9CA3AF', fontWeight: 600 }}>{emptyMessage}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, rIdx) => {
                  const key = row.id ?? rIdx;
                  return (
                    <TableRow key={key} hover>
                      {columns.map((col) => (
                        <TableCell key={col.id} align={col.align || 'left'} sx={{ fontSize: '0.85rem', color: '#374151' }}>
                          {col.render ? col.render(row) : (row as any)[col.id]}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && (currentTotal > 0) && (
          <TablePagination
            component="div"
            count={currentTotal}
            page={currentPage}
            onPageChange={handleChangePage}
            rowsPerPage={currentRowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 20, 25, 50, 100]}
            sx={{ borderTop: '1px solid #E5E7EB' }}
          />
        )}
      </Box>
    </Box>
  );
}
