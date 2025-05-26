import { useState } from 'react';
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
  Palette
} from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    restaurantName: 'ezPay Restaurant',
    address: '123 Main Street, City, State 12345',
    phone: '(555) 123-4567',
    taxRate: 10,
    includeLogoOnBill: true,
    footerText: 'Thank you for dining with us!',
    showItemizedTax: true,
    showServerName: true,
    billFontSize: 10,
    headerColor: '#FF0000',
  });
  
  const [logo, setLogo] = useState<File | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogo(e.target.files[0]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save settings to local storage or database
    localStorage.setItem('billSettings', JSON.stringify(formData));
    alert('Settings saved successfully!');
  };

  const handleTestPrint = () => {
    // Generate a test bill with current settings
    const testTransaction = {
      id: 'TEST-001',
      items: [
        {
          menuItem: {
            id: '1',
            name: 'Test Item 1',
            price: 1200.00,
            description: '',
            sectionId: '1',
            available: true,
          },
          quantity: 2
        }
      ],
      totalAmount: 2400.00,
      employeeName: 'Test Server',
      customerName: 'Test Customer',
      tableNumber: 'T1',
    };

    const settings = {
      restaurantName: formData.restaurantName,
      showLogo: formData.includeLogoOnBill,
      taxRate: formData.taxRate,
      footerText: formData.footerText,
      showServerName: formData.showServerName,
      fontSize: formData.billFontSize,
      headerColor: formData.headerColor,
    };

    const doc = generateBillPDF(testTransaction, settings);
    doc.save('test-bill.pdf');
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Restaurant Information */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Restaurant Information</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name
                </label>
                <div className="relative">
                  <Building size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="restaurantName"
                    name="restaurantName"
                    type="text"
                    value={formData.restaurantName}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field pl-10"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <div className="relative">
                <Percent size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Image size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </form>
        </div>
        
        {/* Bill Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Receipt Settings</h2>
          
          <div className="space-y-4 mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="includeLogoOnBill"
                checked={formData.includeLogoOnBill}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Include logo on receipts</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="showItemizedTax"
                checked={formData.showItemizedTax}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Show itemized tax</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="showServerName"
                checked={formData.showServerName}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Show server name</span>
            </label>

            <div>
              <label htmlFor="billFontSize" className="block text-sm font-medium text-gray-700 mb-1">
                Bill Font Size
              </label>
              <div className="relative">
                <Type size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="billFontSize"
                  name="billFontSize"
                  type="number"
                  min="8"
                  max="14"
                  value={formData.billFontSize}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="headerColor" className="block text-sm font-medium text-gray-700 mb-1">
                Header Color
              </label>
              <div className="relative">
                <Palette size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="headerColor"
                  name="headerColor"
                  type="color"
                  value={formData.headerColor}
                  onChange={handleChange}
                  className="input-field pl-10 h-10"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="footerText" className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Footer Text
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                id="footerText"
                name="footerText"
                value={formData.footerText}
                onChange={handleChange}
                className="input-field pl-10"
                rows={3}
              />
            </div>
          </div>
          
          <button 
            className="btn btn-secondary flex items-center gap-2 w-full"
            onClick={handleTestPrint}
          >
            <Printer size={18} />
            Print Test Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;