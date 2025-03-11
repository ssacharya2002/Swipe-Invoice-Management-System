import React, { useState } from "react";
import { Invoice, Product, Customer } from "../types/index";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Search, Trash } from "lucide-react";
import { AlertModal } from "./ui/modals/alert-modal";
import { useDispatch } from "react-redux";
import { UpdateModal } from "./ui/modals/Update-modal";
import { deleteItem, updateItem } from "@/store/actions";

interface DataTableProps {
  data: (Invoice | Product | Customer)[];
  type: "invoices" | "products" | "customers";
}

export const DataTable: React.FC<DataTableProps> = ({ data, type }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [UpdateModalOpen, setUpdateModalOpen] = useState(false);

  const dispatch = useDispatch();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string>("");

  const [updateData, setUpdateData] = useState<Invoice | Product | Customer>();
  const [updateDataType, setUpdateDataType] = useState<string>();

  const getHeaders = () => {
    const headers = {
      invoices: [
        "Serial Number",
        "Customer Name",
        "Product Name",
        "Quantity",
        "Tax",
        "Total Amount",
        "Date",
      ],
      products: [
        "Serial Number",
        "Name",
        "Quantity",
        "Unit Price",
        "Tax",
        "Price with Tax",
        "Discount",
      ],
      customers: [
        "Name",
        "Phone Number",
        "Total Purchase Amount",
        "Email",
        "Address",
      ],
    };

    return [...headers[type], "Actions"];
  };

  const headerToKeyMap: Record<string, string> = {
    "Serial Number": "serialNumber",
    "Customer Name": "customerName",
    "Product Name": "productName",
    Quantity: "quantity",
    Tax: "tax",
    "Total Amount": "totalAmount",
    Date: "date",
    Name: "name",
    "Unit Price": "unitPrice",
    "Price with Tax": "priceWithTax",
    Discount: "discount",
    "Phone Number": "phoneNumber",
    "Total Purchase Amount": "totalPurchaseAmount",
    Email: "email",
    Address: "address",
    Actions: "actions",
  };

  const getCellValue = (item: any, header: string) => {
    if (header === "Actions") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                setUpdateData(item);
                setUpdateDataType(type);
                setUpdateModalOpen(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={() => {
                setOpen(true);
                setSelectedItem(item); 
                setSelectedType(type);
              }}
            >
              <Trash className="mr-2 h-4 w-4 text-red-600" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const key = headerToKeyMap[header];
    const value = item[key];
    if (typeof value === "number") {
      return value.toFixed(2);
    }
    return value || "-";
  };

  // Get searchable fields based on type
  const getSearchFields = () => {
    switch (type) {
      case "invoices":
        return ["serialNumber", "customerName"];
      case "products":
        return ["serialNumber", "name"];
      case "customers":
        return ["name", "phoneNumber"];
      default:
        return [];
    }
  };

  // search filter logic to search across multiple fields
  const filteredData =
    searchTerm.trim() === ""
      ? data
      : data.filter((item) => {
          const searchFields = getSearchFields();
          return searchFields.some((field) => {
            const value = String(
              item[field as keyof typeof item] || ""
            ).toLowerCase();
            return value.includes(searchTerm.toLowerCase());
          });
        });

  const onDelete = async () => {
    setLoading(true);

    if (
      selectedType === "invoices" ||
      selectedType === "products" ||
      selectedType === "customers"
    ) {
      deleteItem(
        dispatch,
        selectedType as "invoices" | "products" | "customers",
        selectedItem.serialNumber,
        selectedItem.name
      );
    } else {
      console.error("Invalid type:", selectedType);
    }
    setOpen(false);
    setLoading(false);
  };

  const onSave = (newData: Invoice | Product | Customer) => {
    setLoading(true);

    switch (updateDataType) {
      case "invoices":
        updateItem(
          dispatch,
          updateDataType as "invoices" | "products" | "customers",
          (newData as Invoice).serialNumber,
          (updateData as Invoice).customerName,
          newData as Partial<Invoice>
        );
        break;
      case "products":
        updateItem(
          dispatch,
          updateDataType as "invoices" | "products" | "customers",
          (newData as Product).serialNumber,
          (updateData as Product).name,
          newData as Partial<Product>
        );
        break;
      case "customers":
        updateItem(
          dispatch,
          updateDataType as "invoices" | "products" | "customers",
          undefined,
          (updateData as Customer).name,
          newData as Partial<Customer>
        );
        break;
      default:
        console.error("Invalid type:", updateDataType);
    }

    setUpdateModalOpen(false);
    setLoading(false);
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSelectedItem(null);
          setSelectedType("");
        }}
        onConfirm={onDelete}
        loading={loading}
      />

      <UpdateModal
        isOpen={UpdateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        onConfirm={onSave}
        loading={loading}
        type={type}
        data={updateData as any}
      />

      <div className="space-y-4 p-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder={`Search by serial number or name...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableCaption>
              {type.charAt(0).toUpperCase() + type.slice(1)} List
            </TableCaption>
            <TableHeader>
              <TableRow>
                {getHeaders().map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <TableRow key={index} className="hover:bg-muted">
                    {getHeaders().map((header) => (
                      <TableCell key={header}>
                        {getCellValue(item, header)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={getHeaders().length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default DataTable;
