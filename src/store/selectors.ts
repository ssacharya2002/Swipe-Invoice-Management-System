import { RootState } from '../types';

// Invoice selectors
export const selectAllInvoices = (state: RootState) => state.invoices;
export const selectInvoiceBySerialNumber = (state: RootState, serialNumber: string) =>
    state.invoices.find(invoice => invoice.serialNumber === serialNumber);

// Product selectors
export const selectAllProducts = (state: RootState) => state.products;
export const selectProductsByInvoice = (state: RootState, serialNumber: string) =>
    state.products.filter(product => product.serialNumber === serialNumber);
export const selectProduct = (state: RootState, serialNumber: string, name: string) =>
    state.products.find(product => product.serialNumber === serialNumber && product.name === name);

// Customer selectors
export const selectAllCustomers = (state: RootState) => state.customers;
export const selectCustomerByName = (state: RootState, name: string) =>
    state.customers.find(customer => customer.name === name);
export const selectTopCustomers = (state: RootState, limit: number = 5) =>
    [...state.customers]
        .sort((a, b) => b.totalPurchaseAmount - a.totalPurchaseAmount)
        .slice(0, limit);