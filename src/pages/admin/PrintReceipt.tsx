import React from 'react';

// Define types for settings and transaction data
interface ReceiptSettings {
  restaurantName: string;
  address: string;
  phone: string;
  gstin?: string;
  taxRate: number;
  includeLogoOnBill: boolean;
  footerText: string;
  showServerName: boolean;
  logoUrl?: string | null;
  qrCodeUrl?: string | null;
  showGstNumber?: boolean;
  showUpiQrCode?: boolean;
}

interface TransactionItem {
  menuItem: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface Transaction {
  id: string;
  items: TransactionItem[];
  totalAmount: number;
  employeeName: string;
  tableNumber: string;
}

interface PrintReceiptProps {
  settings: ReceiptSettings;
  transaction: Transaction;
  ref: React.Ref<HTMLDivElement>;
}

const PrintReceipt = React.forwardRef<HTMLDivElement, Omit<PrintReceiptProps, 'ref'>>(({ settings, transaction }, ref) => {
  const subtotal = transaction.items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  const taxAmount = (subtotal * settings.taxRate) / 100;
  const total = subtotal + taxAmount;

  // Apply font size from settings
  const receiptStyle: React.CSSProperties = {
    width: '300px',
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: `${settings.billFontSize}px`, // Use billFontSize from settings
    lineHeight: '1.4',
    padding: '10px',
    color: '#000',
    background: '#fff',
  };

  const centerStyle: React.CSSProperties = { textAlign: 'center' };
  const boldStyle: React.CSSProperties = { fontWeight: 'bold' };
  const hrStyle: React.CSSProperties = { borderTop: '1px dashed #000', margin: '10px 0' };
  const itemRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' };
  const logoStyle: React.CSSProperties = { maxWidth: '150px', margin: '0 auto 10px auto', display: 'block' };
  const qrStyle: React.CSSProperties = { maxWidth: '120px', margin: '10px auto', display: 'block' };

  return (
    <div style={receiptStyle} ref={ref}>
      {/* Header */}
      {settings.includeLogoOnBill && settings.logoUrl && <img src={settings.logoUrl} alt="Logo" style={logoStyle} />}
      <div style={{ ...centerStyle, ...boldStyle, fontSize: `${settings.billFontSize + 4}px` }}>
        {settings.restaurantName}
      </div>
      <div style={centerStyle}>{settings.address}</div>
      <div style={centerStyle}>{settings.phone}</div>
      {settings.showGstNumber && settings.gstin && <div style={centerStyle}>GSTIN: {settings.gstin}</div>}
      <hr style={hrStyle} />

      {/* Bill Info */}
      <div>Bill No: {transaction.id}</div>
      <div>Date: {new Date().toLocaleString()}</div>
      <div>Table: {transaction.tableNumber}</div>
      {settings.showServerName && <div>Server: {transaction.employeeName}</div>}
      <hr style={hrStyle} />

      {/* Items */}
      <div style={itemRowStyle}>
        <span style={boldStyle}>Item</span>
        <span style={boldStyle}>Qty</span>
        <span style={boldStyle}>Rate</span>
        <span style={boldStyle}>Amount</span>
      </div>
      <hr style={hrStyle} />
      {transaction.items.map((item, index) => (
        <div key={index} style={itemRowStyle}>
          <span>{item.menuItem.name}</span>
          <span>{item.quantity}</span>
          <span>{item.menuItem.price.toFixed(2)}</span>
          <span>{(item.menuItem.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
      <hr style={hrStyle} />

      {/* Totals */}
      <div style={itemRowStyle}>
        <span>Subtotal:</span>
        <span>{subtotal.toFixed(2)}</span>
      </div>
      <div style={itemRowStyle}>
        <span>GST ({settings.taxRate}%):</span>
        <span>{taxAmount.toFixed(2)}</span>
      </div>
      <hr style={hrStyle} />
      <div style={{ ...itemRowStyle, ...boldStyle, fontSize: `${settings.billFontSize + 2}px` }}>
        <span>TOTAL:</span>
        <span>{total.toFixed(2)}</span>
      </div>
      <hr style={hrStyle} />

      {/* Footer */}
      {settings.showUpiQrCode && settings.qrCodeUrl && (
        <div>
          <div style={centerStyle}>Scan to Pay</div>
          <img src={settings.qrCodeUrl} alt="QR Code" style={qrStyle} />
        </div>
      )}
      <div style={centerStyle}>{settings.footerText}</div>
    </div>
  );
});

PrintReceipt.displayName = 'PrintReceipt';
export default PrintReceipt;