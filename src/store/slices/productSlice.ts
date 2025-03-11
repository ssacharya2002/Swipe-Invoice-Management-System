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


    const relatedInvoice = state.invoices.find(
      (invoice: Invoice) => invoice.serialNumber === productToDelete.serialNumber
    );

    if (relatedInvoice) {
      
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





// Thunk for updating product with associated invoice and customer updates
export const updateProductThunk = (serialNumber: string, name: string, updatedData: Partial<Product>) =>
  (dispatch: any, getState: any) => {
    const state = getState();

    // Find the original product
    const originalProduct = state.products.find(
      (product: Product) => product.serialNumber === serialNumber && product.name === name
    );

    if (!originalProduct) return;

    // Update the product
    dispatch(updateProduct({
      serialNumber,
      name,
      updatedData
    }));

    // Find related invoice
    const relatedInvoice = state.invoices.find(
      (invoice: Invoice) => invoice.serialNumber === originalProduct.serialNumber
    );

    if (relatedInvoice) {
      const updatedInvoiceData: Partial<Invoice> = {};

      // Calculate new price difference if price has changed
      if (updatedData.priceWithTax !== undefined) {
        const priceDifference = updatedData.priceWithTax - originalProduct.priceWithTax;
        updatedInvoiceData.totalAmount = relatedInvoice.totalAmount + priceDifference;

        // Update customer's total purchase amount if price changed
        dispatch(updateCustomerPurchaseAmount({
          name: relatedInvoice.customerName,
          amount: priceDifference
        }));
      }

      // Update quantity if changed
      if (updatedData.quantity !== undefined) {
        const quantityDifference = updatedData.quantity - originalProduct.quantity;
        updatedInvoiceData.quantity = relatedInvoice.quantity + quantityDifference;
      }

      // Update product name in invoice if name changed
      if (updatedData.name !== undefined && updatedData.name !== name) {
        const productNames = relatedInvoice.productName.split(',');
       const nameIndex = productNames.findIndex((pName: string) => pName.trim() === name);

        if (nameIndex !== -1) {
          productNames[nameIndex] = updatedData.name;
          updatedInvoiceData.productName = productNames.join(',');
        }
      }

      // Only dispatch update if there are changes to make
      if (Object.keys(updatedInvoiceData).length > 0) {
        dispatch(updateInvoice({
          serialNumber: relatedInvoice.serialNumber,
          updatedData: updatedInvoiceData
        }));
      }
    }
  };