// src/types/SettingsTypes.ts
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