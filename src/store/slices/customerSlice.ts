import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '../../types';

const initialState: Customer[] = [];

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomer: (state, action: PayloadAction<Customer>) => {
      const existingCustomerIndex = state.findIndex(
        c => c.name === action.payload.name
      );
      
      if (existingCustomerIndex !== -1) {
        // Update existing customer
        const existingCustomer = state[existingCustomerIndex];
        state[existingCustomerIndex] = {
          ...existingCustomer,
          phoneNumber: existingCustomer.phoneNumber || action.payload.phoneNumber,
          email: existingCustomer.email || action.payload.email,
          address: existingCustomer.address || action.payload.address,
          totalPurchaseAmount: existingCustomer.totalPurchaseAmount + action.payload.totalPurchaseAmount
        };
      } else {
        // Add new customer
        state.push(action.payload);
      }
    },
    
    addCustomers: (state, action: PayloadAction<Customer[]>) => {
      return [...state, ...action.payload];
    },
    
    removeCustomer: (state, action: PayloadAction<string>) => {
      return state.filter(customer => customer.name !== action.payload);
    },
    
    updateCustomer: (state, action: PayloadAction<{
      name: string;
      updatedData: Partial<Customer>;
    }>) => {
      const { name, updatedData } = action.payload;
      const customerIndex = state.findIndex(c => c.name === name);
      
      if (customerIndex !== -1) {
        state[customerIndex] = {
          ...state[customerIndex],
          ...updatedData
        };
      }

    },
    
    updateCustomerPurchaseAmount: (state, action: PayloadAction<{
      name: string;
      amount: number;
    }>) => {
      const { name, amount } = action.payload;
      const customer = state.find(c => c.name === name);
      
      if (customer) {
        customer.totalPurchaseAmount += amount;
      }
    }
  }
});

export const { 
  addCustomer,
  addCustomers,
  removeCustomer,
  updateCustomer,
  updateCustomerPurchaseAmount
} = customerSlice.actions;

export default customerSlice.reducer;