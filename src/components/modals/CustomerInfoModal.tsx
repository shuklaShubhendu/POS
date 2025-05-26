import { useState, useEffect } from 'react';
import { X, User, Table } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import Modal from '../ui/Modal';

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({ isOpen, onClose }) => {
  const { cart, setCustomerInfo } = useCart();
  
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  
  // Set initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerName(cart.customerName || '');
      setTableNumber(cart.tableNumber || '');
    }
  }, [isOpen, cart]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update customer info
    setCustomerInfo(
      customerName.trim() || undefined,
      tableNumber.trim() || undefined
    );
    
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md mx-auto">
        <div className="flex justify-between items-center bg-red-600 text-white px-6 py-4">
          <h2 className="text-lg font-semibold">Customer Information</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name (Optional)
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter customer name"
                autoFocus
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Table Number (Optional)
            </label>
            <div className="relative">
              <Table size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="tableNumber"
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="input-field pl-10"
                placeholder="Enter table number"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CustomerInfoModal;