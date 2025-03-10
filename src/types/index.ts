export interface Invoice {
    serialNumber: string;
    customerName: string;
    productName: string;
    quantity: number;
    tax: number;
    totalAmount: number;
    date: string;
  }
  
  export interface Product {
    serialNumber: string;
    name: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    priceWithTax: number;
    discount?: number;
  }
  
  export interface Customer {
    name: string;
    phoneNumber: string;
    totalPurchaseAmount: number;
    email: string;
    address: string;
  }
  
  export interface RootState {
    invoices: Invoice[];
    products: Product[];
    customers: Customer[];
  }