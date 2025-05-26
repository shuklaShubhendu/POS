import { CartItem } from '../types';

interface BillData {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  employeeId: string;
  employeeName: string;
  paymentMethod: 'cash' | 'card' | 'other';
  createdAt: string;
}

const LINE_WIDTH = 48; // Typical width for 80mm thermal printer (48 characters)
const DASH_LINE = '-'.repeat(LINE_WIDTH);

const centerText = (text: string, width: number): string => {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text + ' '.repeat(padding);
};

const justifyText = (left: string, right: string, width: number): string => {
  const totalLength = left.length + right.length;
  if (totalLength >= width) return left + ' ' + right;
  const padding = width - totalLength;
  return left + ' '.repeat(padding) + right;
};

export const generateThermalBill = (bill: BillData): string => {
  const lines: string[] = [];

  // Header (Placeholder values, replace with BillSettings data)
  lines.push(centerText('ezPay Restaurant', LINE_WIDTH));
  lines.push(centerText('123 Main Street, City', LINE_WIDTH));
  lines.push(centerText('Phone: +91 123-456-7890', LINE_WIDTH));
  lines.push(DASH_LINE);

  // Bill Details
  lines.push(centerText('Bill Receipt', LINE_WIDTH));
  lines.push(justifyText(`Bill ID: ${bill.id.slice(0, 8)}`, `Date: ${new Date(bill.createdAt).toLocaleDateString()}`, LINE_WIDTH));
  lines.push(`Served by: ${bill.employeeName.slice(0, LINE_WIDTH - 11)}`);
  if (bill.customerName) {
    lines.push(`Customer: ${bill.customerName.slice(0, LINE_WIDTH - 10)}`);
  }
  if (bill.customerPhone) {
    lines.push(`Phone: ${bill.customerPhone}`);
  }
  if (bill.tableNumber) {
    lines.push(`Table: ${bill.tableNumber}`);
  }
  lines.push(`Payment: ${bill.paymentMethod.charAt(0).toUpperCase() + bill.paymentMethod.slice(1)}`);
  lines.push(DASH_LINE);

  // Items Header
  lines.push(justifyText('Item', 'Qty  Price  Total', LINE_WIDTH));
  lines.push(DASH_LINE);

  // Items List
  bill.items.forEach((item) => {
    const itemName = item.menuItem.name.slice(0, 20).padEnd(20);
    const qty = item.quantity.toString().padStart(3);
    const price = item.menuItem.price.toFixed(2).padStart(6);
    const itemTotal = (item.quantity * item.menuItem.price).toFixed(2).padStart(6);
    lines.push(`${itemName} ${qty}  ${price}  ${itemTotal}`);
  });

  lines.push(DASH_LINE);

  // Summary
  lines.push(justifyText('Subtotal:', `₹${bill.subtotal.toFixed(2)}`, LINE_WIDTH));
  lines.push(justifyText('GST (18%):', `₹${bill.tax.toFixed(2)}`, LINE_WIDTH));
  lines.push(justifyText('Total:', `₹${bill.total.toFixed(2)}`, LINE_WIDTH));
  lines.push(DASH_LINE);

  // Footer
  lines.push(centerText('Thank you for dining with us!', LINE_WIDTH));
  lines.push('\n\n\n'); // Extra line feeds for thermal printer to cut paper

  return lines.join('\n');
};