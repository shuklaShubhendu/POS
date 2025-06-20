import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Trash, Plus, Minus, User, Table, CreditCard, Receipt, Tag, Clock } from 'lucide-react';
import { useMenu } from '../../contexts/MenuContext';
import { useCart } from '../../contexts/CartContext';
import { MenuItem } from '../../types';
import CheckoutModal from '../../components/modals/CheckoutModal';
import CustomerInfoModal from '../../components/modals/CustomerInfoModal';
import { BillSettings, Transaction } from '../admin/Settings';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const PosTerminal = () => {
  const { menuSections, getMenuItemsBySection } = useMenu();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, generateBill } = useCart();
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [displayedItems, setDisplayedItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [customerInfoModalOpen, setCustomerInfoModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPrinting, setIsPrinting] = useState(false);
  const [printContent, setPrintContent] = useState<JSX.Element | null>(null);

  const [billSettings, setBillSettings] = useState<BillSettings>({
    restaurantName: 'ezPay Restaurant',
    address: '123 Main Street, City, State 12345',
    phone: '(555) 123-4567',
    taxRate: 10,
    includeLogoOnBill: false,
    footerText: 'Thank you for dining with us!',
    showItemizedTax: true,
    showServerName: true,
    billFontSize: 7,
    logoUrl: null,
    qrCodeUrl: null,
    showUpiQrCode: false,
  });

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('billSettings');
      if (savedSettings) {
        setBillSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load bill settings:', error);
      toast.error('Failed to load bill settings. Using defaults.');
    }
  }, []);

  useEffect(() => {
    console.log('menuSections:', menuSections);
    console.log('getMenuItemsBySection:', getMenuItemsBySection);
    if (selectedSectionId) {
      const items = getMenuItemsBySection(selectedSectionId) || [];
      console.log('Menu items for section', selectedSectionId, items);
      setDisplayedItems(items);
    } else if (menuSections.length > 0) {
      setSelectedSectionId(menuSections[0].id);
      const items = getMenuItemsBySection(menuSections[0].id) || [];
      console.log('Menu items for default section', menuSections[0].id, items);
      setDisplayedItems(items);
    } else {
      setDisplayedItems([]);
    }
  }, [selectedSectionId, menuSections, getMenuItemsBySection]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      if (selectedSectionId) {
        const items = getMenuItemsBySection(selectedSectionId) || [];
        console.log('Restored section items', selectedSectionId, items);
        setDisplayedItems(items);
      }
      return;
    }
    const allItems = menuSections.flatMap(section => getMenuItemsBySection(section.id));
    const filtered = allItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    console.log('Filtered items for search', searchTerm, filtered);
    setDisplayedItems(filtered);
  }, [searchTerm, selectedSectionId, menuSections, getMenuItemsBySection]);

  const handleSectionClick = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setSearchTerm('');
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentTime);

  const subtotal = cart.totalAmount;
  const tax = subtotal * (billSettings.taxRate / 100);
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Please add items to the cart before checkout');
      return;
    }
    setCheckoutModalOpen(true);
  };

  const handleCustomerInfo = () => {
    setCustomerInfoModalOpen(true);
  };

  const handleActualPrint = useCallback(() => {
    console.log('Calling window.print()');
    window.print();
  }, []);

  useEffect(() => {
    let printTimeoutId: NodeJS.Timeout | null = null;
    let mediaQueryList: MediaQueryList | null = null;

    const afterPrintHandler = () => {
      console.log('Print dialog closed or printing finished.');
      setIsPrinting(false);
      setPrintContent(null);
      window.removeEventListener('afterprint', afterPrintHandler);
      if (mediaQueryList) {
        mediaQueryList.removeEventListener('change', mediaQueryChangeHandler);
      }
    };

    const mediaQueryChangeHandler = (mqlEvent: MediaQueryListEvent) => {
      if (!mqlEvent.matches) {
        console.log('Print media query changed, no longer "print".');
        afterPrintHandler();
      }
    };

    if (isPrinting && printContent) {
      console.log('isPrinting is true, setting up print process...');
      window.addEventListener('afterprint', afterPrintHandler);
      mediaQueryList = window.matchMedia('print');
      mediaQueryList.addEventListener('change', mediaQueryChangeHandler);

      // Wait for the next render cycle to ensure printContent is in the DOM
      printTimeoutId = setTimeout(() => {
        handleActualPrint();
      }, 0);

      return () => {
        console.log('Cleaning up print effect.');
        if (printTimeoutId) clearTimeout(printTimeoutId);
        window.removeEventListener('afterprint', afterPrintHandler);
        if (mediaQueryList) {
          mediaQueryList.removeEventListener('change', mediaQueryChangeHandler);
        }
      };
    }
  }, [isPrinting, printContent, handleActualPrint]);

  const triggerPrint = async () => {
    if (cart.items.length === 0) {
      toast.error('Please add items to the cart before printing');
      return;
    }
    try {
      console.log('Cart items before generating bill:', cart.items);
      const bill = await generateBill(false);
      console.log('Generated bill:', bill);
      if (!bill.props.transaction?.items?.length) {
        throw new Error('No items in the generated bill');
      }
      setPrintContent(bill as JSX.Element);
      setIsPrinting(true);
    } catch (error) {
      console.error('Failed to generate bill for printing:', error);
      toast.error('Failed to generate bill for printing');
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    console.log('Adding item to cart:', item);
    if (item.available && typeof item.price === 'number' && !isNaN(item.price)) {
      addToCart(item);
    } else {
      console.error('Invalid item:', item);
      toast.error(`Cannot add ${item.name} to cart: Invalid data`);
    }
  };

  const printStyles = `
    .print-only {
      display: none;
    }
    @media print {
      .print-only {
        display: block !important;
      }
    }
  `;

  return (
    <div className="h-screen flex flex-col">
      <style>{printStyles}</style>
      {/* <div className="bg-white p-4 border-b flex justify-between items-center">
        <h1 className="text-xl font-bold">POS Terminal</h1>
        <Link to="/settings" className="text-blue-600 hover:underline">Settings</Link>
      </div> */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
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
          
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">GST ({billSettings.taxRate}%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button 
                className="bg-gray-500 text-white py-2 rounded hover:bg-gray-600 flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={clearCart}
                disabled={cart.items.length === 0}
              >
                <Trash size={18} />
                Clear
              </button>
              
              <button 
                className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleCheckout}
                disabled={cart.items.length === 0}
              >
                <CreditCard size={18} />
                Checkout
              </button>
              
              <button 
                className="bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={triggerPrint}
                disabled={cart.items.length === 0}
              >
                <Receipt size={18} />
                Print
              </button>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col h-full overflow-hidden">
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
          
          <div className="p-3 bg-white border-b border-gray-200">
            <div className="relative">
              <input 
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
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
                    className={`bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow ${
                      !item.available ? 'opacity-60' : ''
                    }`}
                    onClick={() => handleAddToCart(item)}
                  >
                    <div className="h-32 bg-gray-200 overflow-hidden rounded-t-lg">
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
      
      {isPrinting && printContent && (
        <div className="print-only" aria-hidden="true">
          {printContent}
        </div>
      )}

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