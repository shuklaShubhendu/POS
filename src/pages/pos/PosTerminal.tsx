import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Trash, 
  Plus, 
  Minus, 
  User, 
  Table, 
  CreditCard, 
  BanknoteIcon,
  Receipt, 
  Tag,
  Clock
} from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { useCart } from '../../contexts/CartContext';
import { MenuItem } from '../../types';
import CheckoutModal from '../../components/modals/CheckoutModal';
import CustomerInfoModal from '../../components/modals/CustomerInfoModal';

const PosTerminal = () => {
  const { menuSections, getMenuItemsBySection } = useMenu();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [displayedItems, setDisplayedItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerInfoModalOpen, setCustomerInfoModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update the displayed items when section changes
  useEffect(() => {
    if (selectedSectionId) {
      setDisplayedItems(getMenuItemsBySection(selectedSectionId));
    } else if (menuSections.length > 0) {
      // Default to first section
      setSelectedSectionId(menuSections[0].id);
      setDisplayedItems(getMenuItemsBySection(menuSections[0].id));
    }
  }, [selectedSectionId, menuSections, getMenuItemsBySection]);
  
  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // If search is cleared, show selected section items
      if (selectedSectionId) {
        setDisplayedItems(getMenuItemsBySection(selectedSectionId));
      }
      return;
    }
    
    // Search across all menu items
    const allItems = menuSections.flatMap(section => 
      getMenuItemsBySection(section.id)
    );
    
    const filtered = allItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setDisplayedItems(filtered);
  }, [searchTerm, selectedSectionId, menuSections, getMenuItemsBySection]);
  
  // Handle section click
  const handleSectionClick = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSearchTerm('');
  };
  
  // Format time
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentTime);
  
  // Calculate subtotal, tax, and total
  const subtotal = cart.totalAmount;
  const taxRate = 0.18; // 18% GST
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  // Handle checkout
  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert('Please add items to the cart before checkout');
      return;
    }
    
    setCheckoutModalOpen(true);
  };
  
  // Open customer info modal
  const handleCustomerInfo = () => {
    setCustomerInfoModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left side - Cart */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
          <div className="p-4 bg-red-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <h2 className="font-semibold">Current Order</h2>
            </div>
            <div className="flex items-center text-sm">
              <Clock size={16} className="mr-1" />
              {formattedTime}
            </div>
          </div>
          
          <div className="p-3 bg-gray-100 border-y border-gray-200 flex items-center justify-between">
            <div>
              {(cart.customerName || cart.tableNumber) && (
                <div className="flex flex-col">
                  {cart.customerName && (
                    <div className="flex items-center text-sm">
                      <User size={14} className="mr-1 text-gray-500" />
                      <span>{cart.customerName}</span>
                    </div>
                  )}
                  {cart.tableNumber && (
                    <div className="flex items-center text-sm">
                      <Table size={14} className="mr-1 text-gray-500" />
                      <span>Table {cart.tableNumber}</span>
                    </div>
                  )}
                </div>
              )}
              {!cart.customerName && !cart.tableNumber && (
                <span className="text-sm text-gray-500">No customer info</span>
              )}
            </div>
            
            <button 
              className="px-2 py-1 bg-white text-gray-800 text-sm rounded border border-gray-300 hover:bg-gray-50"
              onClick={handleCustomerInfo}
            >
              {(cart.customerName || cart.tableNumber) ? 'Edit' : 'Add'}
            </button>
          </div>
          
          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingCart size={40} className="mb-2" />
                <p>Cart is empty</p>
                <p className="text-sm">Add items from the menu</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {cart.items.map((item) => (
                  <li key={item.menuItem.id} className="p-3 hover:bg-gray-50">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{item.menuItem.name}</div>
                      <div className="font-semibold">₹{(item.menuItem.price * item.quantity).toFixed(2)}</div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        ₹{item.menuItem.price.toFixed(2)} x {item.quantity}
                      </div>
                      
                      <div className="flex items-center">
                        <button 
                          className="p-1 rounded-full hover:bg-gray-200"
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span className="w-8 text-center">{item.quantity}</span>
                        
                        <button 
                          className="p-1 rounded-full hover:bg-gray-200"
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        >
                          <Plus size={16} />
                        </button>
                        
                        <button 
                          className="p-1 ml-1 rounded-full hover:bg-gray-200 text-red-600"
                          onClick={() => removeFromCart(item.menuItem.id)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <div className="mt-1 text-xs text-gray-500 italic">
                        Note: {item.notes}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Cart totals and checkout */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">GST (18%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button 
                className="btn btn-secondary flex items-center justify-center gap-2"
                onClick={clearCart}
                disabled={cart.items.length === 0}
              >
                <Trash size={18} />
                Clear
              </button>
              
              <button 
                className="btn btn-primary flex items-center justify-center gap-2"
                onClick={handleCheckout}
                disabled={cart.items.length === 0}
              >
                <CreditCard size={18} />
                Checkout
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Menu */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-full overflow-hidden">
          {/* Sections */}
          <div className="flex overflow-x-auto p-2 bg-white border-b border-gray-200">
            {menuSections.map((section) => (
              <button
                key={section.id}
                className={`px-4 py-2 mx-1 rounded-md flex-shrink-0 transition-colors ${
                  selectedSectionId === section.id 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
                onClick={() => handleSectionClick(section.id)}
              >
                {section.name}
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="p-3 bg-white border-b border-gray-200">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Menu items */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
            {displayedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Tag size={40} className="mb-2" />
                <p>No items found</p>
                {searchTerm ? (
                  <p className="text-sm">Try a different search term</p>
                ) : (
                  <p className="text-sm">Try selecting a different section</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayedItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={`card cursor-pointer hover:shadow-md transition-shadow ${
                      !item.available ? 'opacity-60' : ''
                    }`}
                    onClick={() => item.available && addToCart(item)}
                  >
                    <div className="h-32 bg-gray-200 overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-medium line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 h-10">
                        {item.description}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="font-bold text-red-600">₹{item.price.toFixed(2)}</span>
                        {!item.available && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <CheckoutModal 
        isOpen={checkoutModalOpen} 
        onClose={() => setCheckoutModalOpen(false)} 
      />
      
      <CustomerInfoModal 
        isOpen={customerInfoModalOpen} 
        onClose={() => setCustomerInfoModalOpen(false)} 
      />
    </div>
  );
};

export default PosTerminal;