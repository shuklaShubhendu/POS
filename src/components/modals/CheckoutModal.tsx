import { useState } from 'react';
import { X, CreditCard, BanknoteIcon, Wallet, Receipt, Copy } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import Modal from '../ui/Modal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cart, checkout, setCustomerInfo, billText, copyBillText } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('card');
  const [cashReceived, setCashReceived] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const subtotal = cart.totalAmount;
  const taxRate = 0.18; // 18% GST
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const change = parseFloat(cashReceived) > total ? parseFloat(cashReceived) - total : 0;

  const handleCompletePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'cash' && (isNaN(parseFloat(cashReceived)) || parseFloat(cashReceived) < total)) {
      toast.error('Please enter a valid cash amount that is at least equal to the total');
      return;
    }

    setIsLoading(true);
    try {
      setCustomerInfo(customerName, customerPhone, tableNumber);
      await checkout(paymentMethod);
      onClose();
      setCustomerName('');
      setCustomerPhone('');
      setTableNumber('');
      setCashReceived('');
      setPaymentMethod('card');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(`Checkout failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-lg mx-auto">
        <div className="flex justify-between items-center bg-red-600 text-white px-6 py-4">
          <h2 className="text-lg font-semibold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
            aria-label="Close modal"
            disabled={isLoading}
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleCompletePayment} className="p-6">
          {/* Customer Name Input */}
          <div className="mb-6">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Customer Name (Optional)
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Enter customer name"
              disabled={isLoading}
            />
          </div>

          {/* Customer Phone Input */}
          <div className="mb-6">
            <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Customer Phone (Optional)
            </label>
            <input
              id="customerPhone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Enter customer phone"
              disabled={isLoading}
            />
          </div>

          {/* Table Number Input */}
          <div className="mb-6">
            <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Table Number (Optional)
            </label>
            <input
              id="tableNumber"
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Enter table number"
              disabled={isLoading}
            />
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="max-h-40 overflow-y-auto mb-4">
                <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                  {cart.items.map((item) => (
                    <li key={item.menuItem.id} className="py-2 flex justify-between">
                      <div>
                        <span className="font-medium">{item.menuItem.name}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">x{item.quantity}</span>
                      </div>
                      <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Text Display (after checkout) */}
          {billText && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Bill Text for Thermal Printer</h3>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md relative">
                <pre className="text-sm font-mono whitespace-pre">{billText}</pre>
                <button
                  type="button"
                  onClick={copyBillText}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  aria-label="Copy bill text"
                >
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Copy the above text and paste it into your thermal printer app (e.g., RawBT, ePOS-Print) to print.
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  paymentMethod === 'card'
                    ? 'bg-red-50 border-red-600 text-red-700 dark:bg-red-900 dark:border-red-500'
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setPaymentMethod('card')}
                disabled={isLoading}
                aria-label="Select card payment"
              >
                <CreditCard size={24} className="mb-2" aria-hidden="true" />
                <span>Card</span>
              </button>

              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  paymentMethod === 'cash'
                    ? 'bg-red-50 border-red-600 text-red-700 dark:bg-red-900 dark:border-red-500'
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setPaymentMethod('cash')}
                disabled={isLoading}
                aria-label="Select cash payment"
              >
                <BanknoteIcon size={24} className="mb-2" aria-hidden="true" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
                  paymentMethod === 'other'
                    ? 'bg-red-50 border-red-600 text-red-700 dark:bg-red-900 dark:border-red-500'
                    : 'border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
                onClick={() => setPaymentMethod('other')}
                disabled={isLoading}
                aria-label="Select other payment"
              >
                <Wallet size={24} className="mb-2" aria-hidden="true" />
                <span>Other</span>
              </button>
            </div>
          </div>

          {/* Cash Received Input */}
          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <label
                htmlFor="cashReceived"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
              >
                Cash Received
              </label>
              <input
                id="cashReceived"
                type="number"
                min={total}
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                placeholder={`Minimum ₹${total.toFixed(2)}`}
                disabled={isLoading}
                aria-required="true"
              />
              {parseFloat(cashReceived) >= total && (
                <div className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 p-3 rounded-md flex justify-between mt-2">
                  <span>Change to give:</span>
                  <span className="font-bold">₹{change.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 disabled:bg-gray-200 dark:disabled:bg-gray-700"
              disabled={isLoading}
              aria-label="Cancel checkout"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 dark:disabled:bg-red-500"
              disabled={
                isLoading ||
                (paymentMethod === 'cash' && (isNaN(parseFloat(cashReceived)) || parseFloat(cashReceived) < total))
              }
              aria-label="Complete payment"
            >
              <Receipt size={18} aria-hidden="true" />
              {isLoading ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CheckoutModal;