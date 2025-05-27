import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Printer,
  FileText,
  Building,
  Phone,
  MapPin,
  Percent,
  Image,
  Type,
  Palette,
  Info,
  X,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import PrintReceipt from './PrintReceipt';

// --- Error Boundary for Debugging ---
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div>Error in PrintReceipt: {this.state.error?.toString()}</div>;
    }
    return this.props.children;
  }
}

// --- Reusable Form Field Components ---
const InputField = ({ id, label, icon: Icon, type = 'text', value, onChange, placeholder = '', ...props }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative mt-1 rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon size={16} className="text-gray-400" />
      </div>
      <input
        type={type}
        name={id}
        id={id}
        className="block w-full rounded-md border-gray-300 pl-10 focus:border-red-500 focus:ring-red-500 sm:text-sm py-2"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  </div>
);

const TextareaField = ({ id, label, icon: Icon, value, onChange, rows = 2 }: any) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative mt-1 rounded-md shadow-sm">
      <div className="pointer-events-none absolute left-0 top-0 flex items-center pl-3 pt-3">
        <Icon size={16} className="text-gray-400" />
      </div>
      <textarea
        name={id}
        id={id}
        rows={rows}
        className="block w-full rounded-md border-gray-300 pl-10 pt-2 focus:border-red-500 focus:ring-red-500 sm:text-sm"
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

const CheckboxField = ({ id, label, checked, onChange }: any) => (
  <label htmlFor={id} className="flex items-center space-x-3 cursor-pointer">
    <input
      id={id}
      name={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
    />
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </label>
);

const FileUploadField = ({ id, label, onChange, previewUrl, onRemove }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="mt-1 flex items-center space-x-4">
      {previewUrl ? (
        <div className="relative group">
          <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md border border-gray-300" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove image"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="h-16 w-16 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
          <Image size={32} className="text-gray-400" />
        </div>
      )}
      <label
        htmlFor={id}
        className="cursor-pointer rounded-md border border-gray-300 bg-white py-2 px-3 text-sm font-medium leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <span>Choose File</span>
        <input id={id} name={id} type="file" className="sr-only" onChange={onChange} accept="image/*" />
      </label>
    </div>
  </div>
);

// --- Settings Component ---
interface BillSettings {
  restaurantName: string;
  address: string;
  phone: string;
  gstin: string;
  taxRate: number;
  includeLogoOnBill: boolean;
  footerText: string;
  showItemizedTax: boolean;
  showServerName: boolean;
  billFontSize: number;
  headerColor: string;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  showGstNumber: boolean;
  showUpiQrCode: boolean;
}

const Settings = () => {
  const [formData, setFormData] = useState<BillSettings>({
    restaurantName: 'ezPay Restaurant',
    address: '123 Main Street, City, State 12345',
    phone: '(555) 123-4567',
    gstin: '',
    taxRate: 10,
    includeLogoOnBill: true,
    footerText: 'Thank you for dining with us!',
    showItemizedTax: true,
    showServerName: true,
    billFontSize: 10,
    headerColor: '#ef4444',
    logoUrl: null,
    qrCodeUrl: null,
    showGstNumber: true,
    showUpiQrCode: true,
  });

  const printComponentRef = useRef<HTMLDivElement>(null);

  // Load settings on initial render
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('billSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Failed to load/parse settings:', error);
    }
  }, []);

  // Debug formData and printComponentRef
  useEffect(() => {
    console.log('FormData:', formData);
    console.log('printComponentRef.current:', printComponentRef.current);
  }, [formData]);

  // Handle standard input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle file uploads (Logo & QR)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, formField: 'logoUrl' | 'qrCodeUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [formField]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Allow re-uploading the same file
  };

  // Remove uploaded image
  const removeImage = (formField: 'logoUrl' | 'qrCodeUrl') => {
    setFormData((prev) => ({ ...prev, [formField]: null }));
  };

  // Save settings to localStorage
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('billSettings', JSON.stringify(formData));
    alert('Settings saved successfully!');
  };

  // Prepare test data for printing
  const testTransaction = {
    id: 'TEST-001',
    items: [
      { menuItem: { name: 'Paneer Tikka', price: 250.0 }, quantity: 2 },
      { menuItem: { name: 'Butter Naan', price: 40.0 }, quantity: 4 },
      { menuItem: { name: 'Coke (600ml)', price: 60.0 }, quantity: 1 },
    ],
    totalAmount: 720.0,
    employeeName: 'Ramesh',
    tableNumber: 'T5',
  };

  // Setup print handler
  const handlePrint = useReactToPrint({
    content: () => {
      console.log('Attempting to print, printComponentRef.current:', printComponentRef.current);
      if (!printComponentRef.current) {
        console.error('Print component ref is null');
        return null;
      }
      return printComponentRef.current;
    },
    documentTitle: 'Test-Receipt',
    pageStyle: `@media print { @page { size: 80mm auto; margin: 5mm; } body { margin: 0; -webkit-print-color-adjust: exact; } }`,
    onPrintError: (errorLocation, error) => {
      console.error(`Print error at ${errorLocation}:`, error);
      alert('Failed to print. Check the console for details.');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">POS Settings</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Left Column: Restaurant Information --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-6">Restaurant Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField id="restaurantName" label="Restaurant Name" icon={Building} value={formData.restaurantName} onChange={handleChange} />
            <InputField id="phone" label="Phone Number" icon={Phone} value={formData.phone} onChange={handleChange} />
          </div>
          <TextareaField id="address" label="Address" icon={MapPin} value={formData.address} onChange={handleChange} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="gstin"
              label="GST Identification Number (GSTIN)"
              icon={Info}
              value={formData.gstin}
              onChange={handleChange}
              placeholder="e.g., 29ABCDE1234F1Z5"
            />
            <InputField
              id="taxRate"
              label="Default GST Rate (%)"
              icon={Percent}
              type="number"
              min="0"
              step="0.01"
              value={formData.taxRate}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <FileUploadField
              id="logo"
              label="Restaurant Logo"
              onChange={(e: any) => handleFileChange(e, 'logoUrl')}
              previewUrl={formData.logoUrl}
              onRemove={() => removeImage('logoUrl')}
            />
            <FileUploadField
              id="qrCode"
              label="Payment QR Code"
              onChange={(e: any) => handleFileChange(e, 'qrCodeUrl')}
              previewUrl={formData.qrCodeUrl}
              onRemove={() => removeImage('qrCodeUrl')}
            />
          </div>
          <div className="pt-6 border-t mt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-red-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>

        {/* --- Right Column: Receipt Settings --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-6">Receipt Settings</h2>
          <div className="space-y-4">
            <CheckboxField
              id="includeLogoOnBill"
              label="Include logo on receipts"
              checked={formData.includeLogoOnBill}
              onChange={handleChange}
            />
            <CheckboxField id="showGstNumber" label="Show GSTIN on receipts" checked={formData.showGstNumber} onChange={handleChange} />
            <CheckboxField id="showUpiQrCode" label="Show Payment QR Code" checked={formData.showUpiQrCode} onChange={handleChange} />
            <CheckboxField id="showServerName" label="Show server name" checked={formData.showServerName} onChange={handleChange} />
          </div>
          <hr className="my-6" />
          <div className="space-y-6">
            <InputField
              id="billFontSize"
              label="Font Size (Screen/PDF)"
              icon={Type}
              type="number"
              min="8"
              max="16"
              value={formData.billFontSize}
              onChange={handleChange}
            />
            <div>
              <label htmlFor="headerColor" className="block text-sm font-medium text-gray-700 mb-1">
                Header Color (Screen/PDF)
              </label>
              <div className="relative mt-1 rounded-md shadow-sm flex items-center border border-gray-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Palette size={16} className="text-gray-400" />
                </div>
                <input
                  id="headerColor"
                  name="headerColor"
                  type="color"
                  value={formData.headerColor}
                  onChange={handleChange}
                  className="block w-full h-9 pl-10 border-0 rounded-md focus:ring-0 p-1 cursor-pointer"
                />
              </div>
            </div>
            <TextareaField id="footerText" label="Receipt Footer Text" icon={FileText} value={formData.footerText} onChange={handleChange} rows={3} />
          </div>
          <div className="pt-6 border-t mt-6">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-gray-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
            >
              <Printer size={18} />
              Print Test Receipt
            </button>
          </div>
        </div>
      </form>

      {/* --- Hidden component for printing --- */}
      <div style={{ display: 'none' }}>
        <ErrorBoundary>
          <PrintReceipt ref={printComponentRef} settings={formData} transaction={testTransaction} />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Settings;