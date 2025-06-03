import React, { useEffect, useState } from 'react';
import type { BillSettings, Transaction } from './Settings';

// Define default settings to handle edge cases
const defaultSettings: Partial<BillSettings> = {
  billFontSize: 10,
  taxRate: 0,
  showItemizedTax: false,
  restaurantName: 'Restaurant',
  address: '',
  phone: '',
  footerText: 'Thank you for dining with us!',
};

interface PrintReceiptProps {
  settings: BillSettings;
  transaction: Transaction;
}

const PrintReceipt: React.FC<PrintReceiptProps> = ({ settings, transaction }) => {
  const [currentDateTime, setCurrentDateTime] = useState(
    new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  );

  // Update date/time every minute to keep it fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Merge provided settings with defaults to avoid undefined values
  const safeSettings = { ...defaultSettings, ...settings };

  // Calculate totals
  const subtotal = transaction.items.reduce((acc, item) => acc + (item.menuItem.price * item.quantity || 0), 0);
  const taxAmount = (subtotal * (safeSettings.taxRate || 0)) / 100;
  const total = subtotal + (safeSettings.showItemizedTax ? taxAmount : 0);

  // Base font size for print (in pt) and screen (in px)
  const baseFontSize = safeSettings.billFontSize || 10;

  // Styles
  const receiptStyle: React.CSSProperties = {
    width: '300px',
    fontFamily: 'Arial, sans-serif',
    fontSize: `${baseFontSize + 4}px`,
    lineHeight: '1.4',
    padding: '10px',
    color: '#000000',
    background: '#ffffff',
    boxSizing: 'border-box',
    margin: '0 auto',
  };

  // const centerStyle: React.CSSProperties = { textAlign: 'center' };
  const boldStyle: React.CSSProperties = { fontWeight: 'bold' };
  const logoStyle: React.CSSProperties = {
    maxWidth: '70%', // Increased from 50%
    maxHeight: '60px', // Increased from 40px
    margin: '0 auto 8px auto',
    display: 'block',
    objectFit: 'contain',
  };
const centerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
};

const qrStyle: React.CSSProperties = {
  maxWidth: '120px', // Increased from 80px
  maxHeight: '120px', // Increased from 80px
  margin: '8px auto',
  display: 'block',
};
  // Print-specific CSS
  const printCSS = `
    @media print {
      html, body {
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        visibility: visible !important;
      }

      body * {
        visibility: hidden !important;
        background: transparent !important;
        color: #000 !important;
        box-shadow: none !important;
        text-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      #print-receipt, #print-receipt * {
        visibility: visible !important;
      }

      #print-receipt {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: ${safeSettings.receiptWidth || '58mm'} !important;
        min-height: 10mm !important;
        background: #fff !important;
        padding: 5mm !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        font-family: Arial, sans-serif !important;
        font-size: ${baseFontSize}pt !important;
        line-height: 1.4 !important;
        color: #000 !important;
      }

      #print-receipt img {
        filter: grayscale(100%) !important;
        max-width: 100% !important;
        object-fit: contain !important;
      }

      table {
        width: 100% !important;
        font-size: ${baseFontSize}pt !important;
        border-collapse: collapse !important;
      }
      th, td {
        padding: 2pt 0 !important;
      }
      th {
        font-weight: 500 !important;
        border-bottom: 1pt solid #000 !important;
      }
      td {
        border-bottom: 1pt dashed #000 !important;
      }

      @page {
        size: ${safeSettings.receiptWidth || '58mm'} auto !important;
        margin: 0mm !important;
      }

      body::-webkit-scrollbar { display: none !important; }
      body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
    }
  `;

  return (
    <>
      <style>{printCSS}</style>
      <div id="print-receipt" style={receiptStyle} role="document" aria-label="Receipt">
        {/* Header */}
        <header style={centerStyle}>
          {safeSettings.includeLogoOnBill && safeSettings.logoUrl && (
            <img src={safeSettings.logoUrl} alt="Restaurant Logo" style={logoStyle} onError={(e) => (e.currentTarget.style.display = 'none')} />
          )}
          <h2 style={{ fontSize: `${baseFontSize + 8}px`, margin: '0 0 4px 0', ...boldStyle }}>
            {safeSettings.restaurantName}
          </h2>
          {safeSettings.address && (
            <p style={{ fontSize: `${baseFontSize + 2}px`, margin: '0 0 2px 0', color: '#6b7280' }}>
              {safeSettings.address}
            </p>
          )}
          {safeSettings.phone && (
            <p style={{ fontSize: `${baseFontSize + 2}px`, margin: '0 0 2px 0', color: '#6b7280' }}>
              {safeSettings.phone}
            </p>
          )}
          <p style={{ fontSize: `${baseFontSize + 2}px`, margin: '0 0 8px 0', color: '#6b7280' }}>
            {currentDateTime}
          </p>
        </header>

        {/* Transaction Details */}
        <section style={{ fontSize: `${baseFontSize + 2}px`, marginBottom: '8px' }} aria-label="Transaction Details">
          <div>Bill No: {transaction.id || 'N/A'}</div>
          <div>Table: {transaction.tableNumber || 'N/A'}</div>
          {safeSettings.showServerName && transaction.employeeName && (
            <div>Server: {transaction.employeeName}</div>
          )}
        </section>

        {/* Items Table */}
        <table style={{ marginBottom: '12px' }} aria-label="Order Items">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price ({safeSettings.currency || '₹'})</th>
              <th style={{ textAlign: 'right' }}>Total ({safeSettings.currency || '₹'})</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.length > 0 ? (
              transaction.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '4px 0' }}>{item.menuItem.name || 'Unknown Item'}</td>
                  <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity || 0}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0' }}>
                    {(item.menuItem.price || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 0' }}>
                    {((item.menuItem.price || 0) * (item.quantity || 0)).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '4px 0' }}>
                  Noлья

 items in transaction
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '8px 0' }} />
        <section style={{ fontSize: `${baseFontSize + 4}px`, marginBottom: '12px' }} aria-label="Totals">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Subtotal:</span>
            <span>
              {safeSettings.currency || '₹'}
              {subtotal.toFixed(2)}
            </span>
          </div>
          {safeSettings.showItemizedTax && taxAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Tax ({(safeSettings.taxRate || 0).toFixed(0)}%):</span>
              <span>
                {safeSettings.currency || '₹'}
                {taxAmount.toFixed(2)}
              </span>
            </div>
          )}
          <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '4px 0' }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              ...boldStyle,
              fontSize: `${baseFontSize + 6}px`,
              color: '#2563eb',
            }}
          >
            <span>Grand Total:</span>
            <span>
              {safeSettings.currency || '₹'}
              {total.toFixed(2)}
            </span>
          </div>
        </section>

        {/* QR Code */}
{safeSettings.showUpiQrCode && safeSettings.qrCodeUrl && (
  <div style={centerStyle} aria-label="Payment QR Code">
    <p style={{ fontSize: `${baseFontSize + 2}px`, margin: '8px 0 4px 0' }}>Scan to Pay</p>
    <img
      src={safeSettings.qrCodeUrl}
      alt="UPI QR Code"
      style={qrStyle}
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  </div>
)}

        {/* Footer */}
        <footer
          style={{ fontSize: `${baseFontSize + 2}px`, textAlign: 'center', marginTop: '16px', color: '#6b7280' }}
        >
          {safeSettings.footerText && <p>{safeSettings.footerText}</p>}
          <p>Powered by </p>
          <p>Boxsam Technologies Pvt Ltd</p>
        </footer>
      </div>
    </>
  );
};

export default PrintReceipt;