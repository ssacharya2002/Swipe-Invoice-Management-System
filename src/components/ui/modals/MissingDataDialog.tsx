import React, { useState, useEffect } from "react";
import { Modal } from "../modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer, Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

type MissingDataItem = {
  serialNumber: string;
  customerName: string;
  quantity: number;
  tax: number;
  totalAmount: number;
  date: string;
  product: Product[];
  customer: Customer;
};

interface MissingDataModalProps {
  missingData: MissingDataItem[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: (completedData: any[]) => void;
}

const MissingDataModal: React.FC<MissingDataModalProps> = ({
  missingData,
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editedData, setEditedData] = useState<MissingDataItem[]>([]);
  const [activeTab, setActiveTab] = useState("invoice");

  // Initialize or reset the edited data when the modal opens or missing data changes
  useEffect(() => {
    if (isOpen && missingData.length > 0) {
      setCurrentIndex(0);
      setEditedData([...missingData]);
      setActiveTab("invoice");
    }
  }, [isOpen, missingData]);

  if (!isOpen || missingData.length === 0 || !editedData[currentIndex]) {
    return null;
  }

  const currentItem = editedData[currentIndex];
  const isLastItem = currentIndex === missingData.length - 1;

  const handleNext = () => {
    if (currentIndex < missingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(editedData);
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const updateInvoiceField = (field: keyof MissingDataItem, value: any) => {
    const updatedData = [...editedData];
    updatedData[currentIndex] = {
      ...updatedData[currentIndex],
      [field]: value,
    };

    // Sync customerName with customer.name when customerName is updated
    if (field === "customerName") {
      updatedData[currentIndex].customer = {
        ...updatedData[currentIndex].customer,
        name: value,
      };
    }

    setEditedData(updatedData);
  };
  const updateCustomerField = (field: keyof Customer, value: any) => {
    const updatedData = [...editedData];
    updatedData[currentIndex] = {
      ...updatedData[currentIndex],
      customer: {
        ...updatedData[currentIndex].customer,
        [field]: value,
      },
    };
    setEditedData(updatedData);
  };

  const updateProductField = (
    productIndex: number,
    field: keyof Product,
    value: any
  ) => {
    const updatedData = [...editedData];
    const products = [...updatedData[currentIndex].product];

    products[productIndex] = {
      ...products[productIndex],
      [field]: value,
    };

    updatedData[currentIndex] = {
      ...updatedData[currentIndex],
      product: products,
    };

    setEditedData(updatedData);
  };

  return (
    <Modal
      title="Complete Missing Information"
      description={`Record ${currentIndex + 1} of ${missingData.length}: ${
        currentItem.serialNumber || "New Record"
      }`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="py-2  max-h-[70vh] overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="invoice">Invoice Details</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Invoice Number</Label>
                    <Input
                      id="serialNumber"
                      value={currentItem.serialNumber || ""}
                      onChange={(e) =>
                        updateInvoiceField("serialNumber", e.target.value)
                      }
                      placeholder="Enter invoice number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {currentItem.date
                            ? format(new Date(currentItem.date), "PPP")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            currentItem.date
                              ? new Date(currentItem.date)
                              : undefined
                          }
                          onSelect={(date) =>
                            updateInvoiceField(
                              "date",
                              date ? format(date, "yyyy-MM-dd") : ""
                            )
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Total Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={currentItem.quantity || ""}
                      onChange={(e) =>
                        updateInvoiceField("quantity", Number(e.target.value))
                      }
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax">Tax (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      value={currentItem.tax || ""}
                      onChange={(e) =>
                        updateInvoiceField("tax", Number(e.target.value))
                      }
                      placeholder="Enter tax percentage"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="totalAmount">Total Amount</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      value={currentItem.totalAmount || ""}
                      onChange={(e) =>
                        updateInvoiceField(
                          "totalAmount",
                          Number(e.target.value)
                        )
                      }
                      placeholder="Enter total amount"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer">
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={currentItem.customerName || ""}
                      onChange={(e) =>
                        updateInvoiceField("customerName", e.target.value)
                      }
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      value={currentItem.customer?.phoneNumber || ""}
                      onChange={(e) =>
                        updateCustomerField("phoneNumber", e.target.value)
                      }
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={currentItem.customer?.email || ""}
                      onChange={(e) =>
                        updateCustomerField("email", e.target.value)
                      }
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalPurchase">Total Purchase Amount</Label>
                    <Input
                      id="totalPurchase"
                      type="number"
                      value={currentItem.customer?.totalPurchaseAmount || ""}
                      onChange={(e) =>
                        updateCustomerField(
                          "totalPurchaseAmount",
                          Number(e.target.value)
                        )
                      }
                      placeholder="Enter total purchases"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={currentItem.customer?.address || ""}
                      onChange={(e) =>
                        updateCustomerField("address", e.target.value)
                      }
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardContent className="pt-4">
                {currentItem.product.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No products available</p>
                  </div>
                ) : (
                  currentItem.product.map((product, index) => (
                    <div
                      key={index}
                      className="mb-6 border-b pb-4 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Product #{index + 1}</h3>
                        <Badge variant="outline">
                          {product.name || "Unnamed Product"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="space-y-2">
                          <Label htmlFor={`product-name-${index}`}>Name</Label>
                          <Input
                            id={`product-name-${index}`}
                            value={product.name || ""}
                            onChange={(e) =>
                              updateProductField(index, "name", e.target.value)
                            }
                            placeholder="Enter product name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`product-quantity-${index}`}>
                            Quantity
                          </Label>
                          <Input
                            id={`product-quantity-${index}`}
                            type="number"
                            value={product.quantity || ""}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Enter quantity"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`product-unitPrice-${index}`}>
                            Unit Price
                          </Label>
                          <Input
                            id={`product-unitPrice-${index}`}
                            type="number"
                            value={product.unitPrice || ""}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "unitPrice",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Enter unit price"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`product-tax-${index}`}>
                            Tax (%)
                          </Label>
                          <Input
                            id={`product-tax-${index}`}
                            type="number"
                            value={product.tax || ""}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "tax",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Enter tax"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor={`product-priceWithTax-${index}`}>
                            Price With Tax
                          </Label>
                          <Input
                            id={`product-priceWithTax-${index}`}
                            type="number"
                            value={product.priceWithTax || ""}
                            onChange={(e) =>
                              updateProductField(
                                index,
                                "priceWithTax",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Enter price with tax"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <div>
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleNext}>
              {isLastItem ? "Complete" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MissingDataModal;
