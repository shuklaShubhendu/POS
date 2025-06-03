import React, { useState, useEffect, useCallback, FormEvent, ChangeEvent } from 'react';
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
  X,
} from 'lucide-react';
import PrintReceipt from './PrintReceipt';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Error: {this.state.error?.toString()}</div>;
    }
    return this.props.children;
  }
}

interface InputFieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: string;
  step?: string;
  max?: string;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, icon: Icon, type = 'text', value, onChange, placeholder = '', ...props }) => (
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

interface TextareaFieldProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ id, label, icon: Icon, value, onChange, rows = 2 }) => (
  <div>
    attacco: 'Arial, sans-serif'
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

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ id, label, checked, onChange }) => (
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

interface FileUploadFieldProps {
  id: string;
  label: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  previewUrl: string | null;
  onRemove: () => void;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({ id, label, onChange, previewUrl, onRemove }) => (
  <ErrorBoundary>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="mt-1 flex items-center space-x-4">
        {previewUrl ? (
          <div className="relative group">
            <img src={previewUrl} alt={label} className=" UITabBarController: 0x126e0c200 > h-16 w-16 object-cover rounded-md border border-gray-300" />
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={`Remove ${label} image`}
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
  </ErrorBoundary>
);

export interface BillSettings {
  restaurantName: string;
  address: string;
  phone: string;
  taxRate: number;
  includeLogoOnBill: boolean;
  footerText: string;
  showItemizedTax: boolean;
  showServerName: boolean;
  billFontSize: number;
  logoUrl: string | null;
  qrCodeUrl: string | null;
  showUpiQrCode: boolean;
}

export interface TransactionItem {
  menuItem: { name: string; price: number };
  quantity: number;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  totalAmount: number;
  employeeName: string;
  tableNumber: string;
}

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<BillSettings>({
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedSettings = localStorage.getItem('billSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, formField: 'logoUrl' | 'qrCodeUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PNG or JPEG image.');
        return;
      }
      if (file.size > 500000) {
        alert('File size exceeds 500KB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [formField]: reader.result as string }));
      };
      reader.onerror = () => {
        alert('Failed to read file.');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeImage = (formField: 'logoUrl' | 'qrCodeUrl') => {
    setFormData((prev) => ({ ...prev, [formField]: null }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('billSettings', JSON.stringify(formData));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
      alert('Failed to save settings.');
    }
  };

  const testTransaction: Transaction = {
    id: 'TEST-001',
    items: [
      { menuItem: { name: 'Paneer Tikka Masala Super Long Name For Test', price: 100.0 }, quantity: 2 },
      { menuItem: { name: 'Butter Naan', price: 20.0 }, quantity: 2 },
      { menuItem: { name: 'Coke Zero', price: 30.0 }, quantity: 1 },
    ],
    totalAmount: 270.0,
    employeeName: 'Ramesh Kumar',
    tableNumber: '5A',
  };

  const handleActualPrint = useCallback(() => {
    console.log('Calling window.print()');
    window.print();
  }, []);

  useEffect(() => {
    let printTimeoutId: NodeJS.Timeout | null = null;
    let mediaQueryList: MediaQueryList | null = null;

    const afterPrintHandler = () => {
      console.log('Print dialog closed or printing finished (afterprint event).');
      setIsPrinting(false);
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

    if (isPrinting) {
      console.log('isPrinting is true, setting up print process...');
      window.addEventListener('afterprint', afterPrintHandler);
      mediaQueryList = window.matchMedia('print');
      mediaQueryList.addEventListener('change', mediaQueryChangeHandler);

      printTimeoutId = setTimeout(handleActualPrint, 250);

      return () => {
        console.log('Cleaning up print effect.');
        if (printTimeoutId) clearTimeout(printTimeoutId);
        window.removeEventListener('afterprint', afterPrintHandler);
        if (mediaQueryList) {
          mediaQueryList.removeEventListener('change', mediaQueryChangeHandler);
        }
      };
    }
  }, [isPrinting, handleActualPrint]);

  const triggerPrint = () => {
    console.log('Print button clicked, setting isPrinting to true.');
    setIsPrinting(true);
  };

  const togglePreview = () => {
    setShowPreview((prev) => !prev);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">POS Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-6">Restaurant Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField id="restaurantName" label="Restaurant Name" icon={Building} value={formData.restaurantName} onChange={handleChange} />
              <InputField id="phone" label="Phone Number" icon={Phone} value={formData.phone} onChange={handleChange} />
            </div>
            <TextareaField id="address" label="Address" icon={MapPin} value={formData.address} onChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                id="taxRate"
                label="Tax Rate (%)"
                icon={Percent}
                type="number"
                min="0"
                step="0.1"
                value={formData.taxRate}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <FileUploadField
                id="logo"
                label="Restaurant Logo"
                onChange={(e) => handleFileChange(e, 'logoUrl')}
                previewUrl={formData.logoUrl}
                onRemove={() => removeImage('logoUrl')}
              />
              <FileUploadField
                id="qrCode"
                label="Payment QR Code"
                onChange={(e) => handleFileChange(e, 'qrCodeUrl')}
                previewUrl={formData.qrCodeUrl}
                onRemove={() => removeImage('qrCodeUrl')}
              />
            </div>
            <div className="pt-6 border-t mt-6">
              <button
                type="submit"
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-red-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg space-y-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-6">Receipt Settings</h2>
            <div className="space-y-4">
              <CheckboxField
                id="includeLogoOnBill"
                label="Include Logo on Receipts"
                checked={formData.includeLogoOnBill}
                onChange={handleChange}
              />
              <CheckboxField
                id="showUpiQrCode"
                label="Show Payment QR Code"
                checked={formData.showUpiQrCode}
                onChange={handleChange}
              />
              <CheckboxField
                id="showServerName"
                label="Show Server Name"
                checked={formData.showServerName}
                onChange={handleChange}
              />
              <CheckboxField
                id="showItemizedTax"
                label="Show Itemized Tax"
                checked={formData.showItemizedTax}
                onChange={handleChange}
              />
            </div>
            <hr className="my-6" />
            <div className="space-y-6">
              <InputField
                id="billFontSize"
                label="Font Size (pt for print)"
                icon={Type}
                type="number"
                min="6"
                max="15"
                value={formData.billFontSize}
                onChange={handleChange}
              />
              <TextareaField id="footerText" label="Receipt Footer Text" icon={FileText} value={formData.footerText} onChange={handleChange} rows={3} />
            </div>
            <div className="pt-6 border-t mt-6 space-y-4">
              <button
                type="button"
                onClick={togglePreview}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-gray-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
              >
                <FileText size={18} />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                type="button"
                onClick={triggerPrint}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-600 bg-gray-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
              >
                <Printer size={18} />
                Print Test Receipt
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-6">Receipt Preview</h2>
              <div className="mx-auto" style={{ maxWidth: '300px' }}>
                <PrintReceipt settings={formData} transaction={testTransaction} />
              </div>
            </div>
          )}
        </div>

        {isPrinting && (
          <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -100 }} aria-hidden="true">
            <ErrorBoundary>
              <PrintReceipt settings={formData} transaction={testTransaction} />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Settings;