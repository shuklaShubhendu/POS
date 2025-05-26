import { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  Edit, 
  Trash, 
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import { useCustomers } from '../../contexts/CustomerContext';
import AddCustomerModal from '../../components/modals/AddCustomerModal';
import EditCustomerModal from '../../components/modals/EditCustomerModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

const Customers = () => {
  const { customers, categories } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
      
    const matchesCategory = categoryFilter === 'all' || customer.categoryId === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setAddModalOpen(true)}
        >
          <PlusCircle size={18} />
          Add Customer
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
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">{customer.name}</h3>
                  <span className="text-sm text-gray-500">
                    {customer.category?.name || 'No Category'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setEditModalOpen(true);
                  }}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-red-600"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setDeleteModalOpen(true);
                  }}
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={16} className="text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <span>Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <DollarSign size={16} className="text-gray-400" />
                <span>Total Spent: ₹{customer.totalSpent.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Tag size={16} className="text-gray-400" />
                <span>Discount Rate: {customer.discountRate}%</span>
              </div>
            </div>
            
            {customer.loyaltyPoints > 0 && (
              <div className="mt-4 p-2 bg-red-50 rounded-md text-center">
                <span className="text-sm text-red-600 font-medium">
                  {customer.loyaltyPoints} Loyalty Points
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Modals */}
      <AddCustomerModal 
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
      />
      
      {selectedCustomer && (
        <>
          <EditCustomerModal 
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            customer={selectedCustomer}
          />
          
          <DeleteConfirmModal 
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            title="Delete Customer"
            message={`Are you sure you want to delete ${selectedCustomer.name}? This action cannot be undone.`}
            onConfirm={() => {
              // Handle delete
              setDeleteModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default Customers;