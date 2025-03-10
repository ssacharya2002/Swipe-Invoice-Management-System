import { deleteInvoice } from './slices/invoiceSlice';
import { deleteProduct } from './slices/productSlice';
import { removeCustomer, updateCustomer } from './slices/customerSlice';
import { updateInvoice } from './slices/invoiceSlice';
import { updateProduct } from './slices/productSlice';
import { AppDispatch } from './index';
import { Invoice, Product, Customer } from '../types';
import toast from 'react-hot-toast';

// delete function
export const deleteItem = (
  dispatch: AppDispatch,
  type: 'invoices' | 'products' | 'customers',
  serialNumber?: string,
  name?: string
) => {
  try {
    switch (type) {
      case 'invoices':
        if (!serialNumber) throw new Error('Serial number is required to delete an invoice');
        dispatch(deleteInvoice(serialNumber));
        break;
        
      case 'products':
        if (!serialNumber || !name) throw new Error('Serial number and product name are required to delete a product');
        dispatch(deleteProduct(serialNumber, name));
        break;
        
      case 'customers':
        if (!name) throw new Error('Customer name is required to delete a customer');
        dispatch(removeCustomer(name));
        break;
        
      default:
        throw new Error(`Invalid type: ${type}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unknown error occurred');
    }
  }
};

// update function 
export const updateItem = (
  dispatch: AppDispatch,
  type: 'invoices' | 'products' | 'customers',
  serialNumber: string | undefined,
  name: string,
  updatedData: Partial<Invoice | Product | Customer>
) => {
  try {
    switch (type) {
      case 'invoices':
        if (!serialNumber) throw new Error('Serial number is required to update an invoice');
        dispatch(updateInvoice({ 
          serialNumber, 
          updatedData: updatedData as Partial<Invoice> 
        }));
        break;
        
      case 'products':
        if (!serialNumber) throw new Error('Serial number is required to update a product');
        dispatch(updateProduct({ 
          serialNumber, 
          name, 
          updatedData: updatedData as Partial<Product> 
        }));
        break;
        
      case 'customers':
        dispatch(updateCustomer({ 
          name, 
          updatedData: updatedData as Partial<Customer> 
        }));
        break;
        
      default:
        throw new Error(`Invalid type: ${type}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unknown error occurred');
    }
  }
};