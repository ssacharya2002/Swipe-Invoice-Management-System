import { Modal } from "@/components/ui/modal";
import { Button } from "../button";
import { useEffect, useState } from "react";
import { Customer, Invoice, Product } from "@/types";
import { Label } from "../label";
import { Input } from "../input";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: Invoice | Product | Customer) => void;
  loading: boolean;
  type: "invoices" | "products" | "customers";
  data: Invoice | Product | Customer;
}

export const UpdateModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  type,
  data,
}: AlertModalProps) => {
  const [newData, setNewData] = useState({ ...data });

  useEffect(() => {
    setNewData({ ...data });
  }, [data]);

  const invoices = [
    { id: "serialNumber", label: "Serial Number", type: "text" },
    { id: "customerName", label: "Customer Number", type: "text" },
    { id: "productName", label: "Product Name", type: "text" },
    { id: "quantity", label: "Quantity", type: "number" },
    { id: "tax", label: "Tax", type: "number" },
    { id: "totalAmount", label: "Total Amount", type: "number" },
    { id: "date", label: "Date", type: "date" },
  ];

  const products = [
    { id: "serialNumber", label: "Serial Number", type: "text" },
    { id: "name", label: "Product Name", type: "text" },
    { id: "quantity", label: "Quantity", type: "number" },
    { id: "unitPrice", label: "Unit Price", type: "number" },
    { id: "tax", label: "Tax", type: "number" },
    { id: "priceWithTax", label: "Price With Tax", type: "number" },
    { id: "discount", label: "Discount", type: "number" },
  ];

  const customers = [
    { id: "name", label: "Customer Name", type: "text" },
    { id: "phoneNumber", label: "Phone", type: "text" }, 
    { id: "email", label: "Email", type: "email" },
    { id: "address", label: "Address", type: "text" },
    { id: "totalPurchaseAmount", label: "Total Purchase Amount", type: "number", disabled: true },
  ];

  const renderForm = () => {
    if (!data) return null;

    switch (type) {
      case "invoices":
        return invoices.map((item, i) => {
          const invoiceProperty = item.id as keyof Invoice;
          const value = (newData as Invoice)[invoiceProperty];

          return (
            <div
              key={i}
              className="flex justify-between items-center border-b py-2"
            >
              <Label className="font-medium capitalize" htmlFor={item.id}>
                {item.label}
              </Label>
              <Input
                id={item.id}
                type={item.type}
                defaultValue={value}
                className="border rounded p-1 w-1/2"
                onChange={(e) => {
                  setNewData({ ...newData, [item.id]: e.target.value });
                }}
                disabled={item.id === "serialNumber" ? true : false}
              />
            </div>
          );
        });
      case "products":
        return products.map((item, i) => {
          const productProperty = item.id as keyof Product;
          const value = (newData as Product)[productProperty];

          return (
            <div
              key={i}
              className="flex justify-between items-center border-b py-2"
            >
              <Label className="font-medium capitalize" htmlFor={item.id}>
                {item.label}
              </Label>
              <Input
                id={item.id}
                type={item.type}
                defaultValue={value}
                className="border rounded p-1 w-1/2"
                onChange={(e) => {
                  setNewData({ ...newData, [item.id]: e.target.value });
                }}
                disabled={item.id === "serialNumber" ? true : false}
              />
            </div>
          );
        });
      case "customers":
        return customers.map((item, i) => {
          const customerProperty = item.id as keyof Customer;
          const value = (newData as Customer)[customerProperty];

          return (
            <div
              key={i}
              className="flex justify-between items-center border-b py-2"
            >
              <Label className="font-medium capitalize" htmlFor={item.id}>
                {item.label}
              </Label>
              <Input
                id={item.id}
                type={item.type}
                defaultValue={value}
                className="border rounded p-1 w-1/2"
                onChange={(e) => {
                  const newValue = item.type === "number" ? 
                    parseFloat(e.target.value) : 
                    e.target.value;
                  
                  setNewData({ ...newData, [item.id]: newValue });
                }}
                // disabled={item.disabled || item.id === "name" ? true : false}
              />
            </div>
          );
        });
      default:
        return null;
    }
  };

  return (
    <Modal
      title={`Update ${type}`}
      description={`Update ${type} details`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="pt-6 space-y-4 max-h-[60vh] overflow-y-auto">
        {renderForm()}
      </div>
      <div className="pt-6 space-x-2 flex items-center justify-end w-full">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          disabled={loading} 
          variant="default" 
          onClick={() => {            
            onConfirm(newData);
          }}
        >
          Save
        </Button>
      </div>
    </Modal>
  );
};