import { useState, useMemo } from 'react';
import { 
  Calendar, 
  Search, 
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionContext';
import { Transaction } from '../../types';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

const Transactions = () => {
  const { transactions, updateTransaction } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<keyof Transaction>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  // Debounced search handler
  const debouncedSearch = useMemo(
    () => debounce((value: string) => setSearchTerm(value), 300),
    []
  );

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    setIsLoading(true);
    const result = transactions
      .filter((transaction) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          transaction.id.toLowerCase().includes(searchLower) ||
          (transaction.customerName && transaction.customerName.toLowerCase().includes(searchLower)) ||
          transaction.employeeName.toLowerCase().includes(searchLower);
        
        const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
        const matchesPayment = filterPayment === 'all' || transaction.paymentMethod === filterPayment;
        
        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => {
        if (sortBy === 'totalAmount') {
          return sortDirection === 'asc' 
            ? a.totalAmount - b.totalAmount 
            : b.totalAmount - a.totalAmount;
        }
        
        const dateA = a[sortBy] ? new Date(a[sortBy] as string | Date).getTime() : 0;
        const dateB = b[sortBy] ? new Date(b[sortBy] as string | Date).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      });
    setIsLoading(false);
    return result;
  }, [transactions, searchTerm, filterStatus, filterPayment, sortBy, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sort click
  const handleSort = (column: keyof Transaction) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Get sort icon and aria-sort attribute
  const getSortIcon = (column: keyof Transaction) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const getAriaSort = (column: keyof Transaction) => {
    if (sortBy !== column) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  // Check if transaction is from today
  const isToday = (createdAt: Date | null) => {
    const today = new Date().toDateString();
    const transactionDate = createdAt ? new Date(createdAt).toDateString() : '';
    return today === transactionDate;
  };

  // Update transaction status
  const handleStatusChange = async (transactionId: string, newStatus: 'completed' | 'refunded' | 'cancelled') => {
    try {
      await updateTransaction(transactionId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  };

  // Export filtered transactions to CSV
  const exportTransactions = () => {
    const headers = ['Transaction ID', 'Customer', 'Date', 'Amount', 'Payment Method', 'Status', 'Employee'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.customerName || 'Walk-in Customer',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
      t.totalAmount.toFixed(2),
      t.paymentMethod,
      t.status,
      t.employeeName
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={exportTransactions}
          aria-label="Export filtered transactions to CSV"
        >
          <Download size={18} />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search transactions..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="input-field pl-10"
              aria-label="Search transactions by ID, customer, or employee"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="w-40">
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="input-field"
                aria-label="Filter by transaction status"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="w-40">
              <select
                value={filterPayment}
                onChange={(e) => { setFilterPayment(e.target.value); setCurrentPage(1); }}
                className="input-field"
                aria-label="Filter by payment method"
              >
                <option value="all">All Payments</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading transactions...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table" role="grid">
                <thead className="table-header">
                  <tr>
                    <th 
                      className="table-cell-header cursor-pointer" 
                      onClick={() => handleSort('id')}
                      aria-sort={getAriaSort('id')}
                      scope="col"
                    >
                      <div className="flex items-center gap-1">
                        Transaction ID
                        {getSortIcon('id')}
                      </div>
                    </th>
                    <th className="table-cell-header" scope="col">Customer</th>
                    <th 
                      className="table-cell-header cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                      aria-sort={getAriaSort('createdAt')}
                      scope="col"
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {getSortIcon('createdAt')}
                      </div>
                    </th>
                    <th 
                      className="table-cell-header cursor-pointer"
                      onClick={() => handleSort('totalAmount')}
                      aria-sort={getAriaSort('totalAmount')}
                      scope="col"
                    >
                      <div className="flex items-center gap-1">
                        Amount
                        {getSortIcon('totalAmount')}
                      </div>
                    </th>
                    <th className="table-cell-header" scope="col">Payment</th>
                    <th className="table-cell-header" scope="col">Status</th>
                    <th className="table-cell-header" scope="col">Employee</th>
                    <th className="table-cell-header" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="table-row">
                        <td className="table-cell font-medium text-gray-800">
                          #{transaction.id.substring(0, 8)}
                        </td>
                        <td className="table-cell">
                          {transaction.customerName || 'Walk-in Customer'}
                        </td>
                        <td className="table-cell flex items-center">
                          <Calendar size={16} className="mr-2 text-gray-400" aria-hidden="true" />
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="table-cell font-medium">
                          ${transaction.totalAmount.toFixed(2)}
                        </td>
                        <td className="table-cell capitalize">
                          {transaction.paymentMethod}
                        </td>
                        <td className="table-cell">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'refunded'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          {transaction.employeeName}
                        </td>
                        <td className="table-cell">
                          <div className="relative">
                            <select
                              value={transaction.status}
                              onChange={(e) => handleStatusChange(transaction.id, e.target.value as 'completed' | 'refunded' | 'cancelled')}
                              className={`input-field text-sm ${!isToday(transaction.createdAt) ? 'bg-gray-200 cursor-not-allowed' : ''}`}
                              disabled={!isToday(transaction.createdAt)}
                              aria-label={`Change status for transaction ${transaction.id}`}
                            >
                              <option value="completed">Completed</option>
                              <option value="refunded">Refunded</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {!isToday(transaction.createdAt) && (
                              <span className="absolute top-0 left-0 w-full h-full pointer-events-none" title="Status can only be changed for transactions from today"></span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center p-4">
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Transactions;