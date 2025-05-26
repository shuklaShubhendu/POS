import { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download,
  Receipt,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTransactions } from '../../contexts/TransactionContext';
import { Transaction } from '../../types';

const Transactions = () => {
  const { transactions } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState<keyof Transaction>('createdAt');
  
  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((transaction) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        transaction.id.toLowerCase().includes(searchLower) ||
        (transaction.customerName && transaction.customerName.toLowerCase().includes(searchLower)) ||
        transaction.employeeName.toLowerCase().includes(searchLower);
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
      
      // Payment method filter
      const matchesPayment = filterPayment === 'all' || transaction.paymentMethod === filterPayment;
      
      return matchesSearch && matchesStatus && matchesPayment;
    })
    .sort((a, b) => {
      // Handle different types of sorting
      if (sortBy === 'totalAmount') {
        return sortDirection === 'asc' 
          ? a.totalAmount - b.totalAmount 
          : b.totalAmount - a.totalAmount;
      }
      
      // Default date sorting
      const dateA = new Date(a[sortBy] as string).getTime();
      const dateB = new Date(b[sortBy] as string).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  
  // Handle sort click
  const handleSort = (column: keyof Transaction) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc'); // Default to descending for new sort column
    }
  };
  
  // Get sort icon
  const getSortIcon = (column: keyof Transaction) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };
  
  // Export transactions
  const exportTransactions = () => {
    // In a real app, this would generate a CSV or PDF
    alert('In a real app, this would download transaction data as CSV or PDF');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={exportTransactions}
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
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <div className="w-40">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
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
                onChange={(e) => setFilterPayment(e.target.value)}
                className="input-field"
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
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th 
                  className="table-cell-header cursor-pointer" 
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Transaction ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th className="table-cell-header">Customer</th>
                <th 
                  className="table-cell-header cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th 
                  className="table-cell-header cursor-pointer"
                  onClick={() => handleSort('totalAmount')}
                >
                  <div className="flex items-center gap-1">
                    Amount
                    {getSortIcon('totalAmount')}
                  </div>
                </th>
                <th className="table-cell-header">Payment</th>
                <th className="table-cell-header">Status</th>
                <th className="table-cell-header">Employee</th>
                <th className="table-cell-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="table-row">
                    <td className="table-cell font-medium text-gray-800">
                      #{transaction.id.substring(0, 8)}
                    </td>
                    <td className="table-cell">
                      {transaction.customerName || 'Walk-in Customer'}
                    </td>
                    <td className="table-cell flex items-center">
                      <Calendar size={16} className="mr-2 text-gray-400" />
                      {new Date(transaction.createdAt).toLocaleDateString()}
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
                      <button 
                        className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="View Receipt"
                      >
                        <Receipt size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;