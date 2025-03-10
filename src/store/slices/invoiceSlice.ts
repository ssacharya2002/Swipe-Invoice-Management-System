import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice } from '../../types';
import { updateCustomerPurchaseAmount } from './customerSlice';
import { removeProductsByInvoice } from './productSlice';

const initialState: Invoice[] = [];

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    addInvoice: (state, action: PayloadAction<Invoice>) => {
      const existingIndex = state.findIndex(inv => inv.serialNumber === action.payload.serialNumber);
      
      if (existingIndex >= 0) {
        // Replace existing invoice
        state[existingIndex] = action.payload;
      } else {
        // Add new invoice
        state.push(action.payload);
      }
    },
    
    addInvoices: (state, action: PayloadAction<Invoice[]>) => {
      return [...state, ...action.payload];
    },
    
    removeInvoice: (state, action: PayloadAction<string>) => {
      return state.filter(invoice => invoice.serialNumber !== action.payload);
    },
    
    updateInvoice: (state, action: PayloadAction<{
      serialNumber: string;
      updatedData: Partial<Invoice>;
    }>) => {
      const { serialNumber, updatedData } = action.payload;
      const invoiceIndex = state.findIndex(invoice => invoice.serialNumber === serialNumber);
      
      if (invoiceIndex !== -1) {
        state[invoiceIndex] = {
          ...state[invoiceIndex],
          ...updatedData
        };
      }
    }
  }
});


export const { 
  addInvoice, 
  addInvoices, 
  removeInvoice, 
  updateInvoice 
} = invoiceSlice.actions;

// Thunks
export const deleteInvoice = (serialNumber: string) => (dispatch: any, getState: any) => {
  const state = getState();
  const invoiceToDelete:Invoice = state.invoices.find((invoice: Invoice) => invoice.serialNumber === serialNumber);
  
  if (invoiceToDelete) {
    // Update customer's total purchase amount
    dispatch(updateCustomerPurchaseAmount({
      name: invoiceToDelete.customerName,
      amount: -invoiceToDelete.totalAmount
    }));
    
    // Remove associated products
    dispatch(removeProductsByInvoice(serialNumber));
    
    // Remove the invoice
    dispatch(removeInvoice(serialNumber));
  }
};

export default invoiceSlice.reducer;