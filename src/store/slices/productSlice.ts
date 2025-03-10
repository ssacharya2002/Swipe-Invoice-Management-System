import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Invoice, Product } from '../../types';
import { updateInvoice } from './invoiceSlice';
import { updateCustomerPurchaseAmount } from './customerSlice';

const initialState: Product[] = [];

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      const existingIndex = state.findIndex(
        p => p.serialNumber === action.payload.serialNumber && p.name === action.payload.name
      );

      if (existingIndex >= 0) {
        // Replace existing product
        state[existingIndex] = action.payload;
      } else {
        // Add new product
        state.push(action.payload);
      }
    },

    addProducts: (state, action: PayloadAction<Product[]>) => {
      return [...state, ...action.payload];
    },

    removeProduct: (state, action: PayloadAction<{
      serialNumber: string;
      name: string;
    }>) => {
      const { serialNumber, name } = action.payload;
      return state.filter(
        product => !(product.serialNumber === serialNumber && product.name === name)
      );
    },

    removeProductsByInvoice: (state, action: PayloadAction<string>) => {
      return state.filter(product => product.serialNumber !== action.payload);
    },

    updateProduct: (state, action: PayloadAction<{
      serialNumber: string;
      name: string;
      updatedData: Partial<Product>;
    }>) => {
      const { serialNumber, name, updatedData } = action.payload;
      const productIndex = state.findIndex(
        product => product.serialNumber === serialNumber && product.name === name
      );

      if (productIndex !== -1) {
        state[productIndex] = {
          ...state[productIndex],
          ...updatedData
        };
      }
    }
  }
});


export const {
  addProduct,
  addProducts,
  removeProduct,
  removeProductsByInvoice,
  updateProduct
} = productSlice.actions;

export default productSlice.reducer;



// Thunks
export const deleteProduct = (serialNumber: string, name: string) => (dispatch: any, getState: any) => {
  const state = getState();

  const productToDelete = state.products.find((product: Product) => product.serialNumber === serialNumber && product.name === name);

  if (productToDelete) {
    // remove the product
    dispatch(removeProduct({ serialNumber, name }));


    // update the invoice
    const relatedInvoice = state.invoices.find(
      (invoice: Invoice) => invoice.serialNumber === productToDelete.serialNumber
    );

    if (relatedInvoice) {
      // Prepare updated invoice data
      const updatedProductNames = relatedInvoice.productName
        .split(',')
        .filter((product: string) => product !== productToDelete.name)
        .join(',');

      // Update the invoice 
      dispatch(updateInvoice({
        serialNumber: relatedInvoice.serialNumber,
        updatedData: {
          totalAmount: relatedInvoice.totalAmount - productToDelete.priceWithTax,
          quantity: relatedInvoice.quantity - productToDelete.quantity,
          productName: updatedProductNames
        }
      }));

      // update customer's total purchase amount
      dispatch(updateCustomerPurchaseAmount({
        name: relatedInvoice.customerName,
        amount: -productToDelete.priceWithTax
      }));

    }
  } else return;
};