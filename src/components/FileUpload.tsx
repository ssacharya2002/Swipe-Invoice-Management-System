import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { Loader2, Upload } from "lucide-react";
import { Customer, Invoice, Product } from "../types/index";
import MissingDataModal from "./ui/modals/MissingDataDialog";
import { addInvoice } from "@/store/slices/invoiceSlice";
import { addProducts } from "@/store/slices/productSlice";
import { addCustomer } from "@/store/slices/customerSlice";
import { processFile } from "@/utils/fileProcessor";


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

function FileUpload() {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [showMissingDataModal, setShowMissingDataModal] = useState(false);
  const [missingDataItems, setMissingDataItems] = useState<MissingDataItem[]>(
    []
  );

  const handleComplete = (completedData: any[]) => {
    // Process the completed data
    completedData.forEach((item) => {
      
      dispatch(
        addInvoice({
          serialNumber: item.serialNumber,
          customerName: item.customerName,
          productName: productNames(item.product),
          quantity: item.quantity,
          tax: item.tax,
          totalAmount: item.totalAmount,
          date: item.date,
        })
      );

      dispatch(addProducts(item.product));
      dispatch(addCustomer(item.customer));
    });

    // Clear missing data items and close modal
    setMissingDataItems([]);
    setShowMissingDataModal(false);
  };

  function checkMissingData(
    invoice: Invoice,
    customer: Customer,
    products: Product[]
  ): boolean {
    // Check Invoice fields
    if (
      !invoice.serialNumber ||
      !invoice.customerName ||
      invoice.quantity === undefined ||
      invoice.quantity === null ||
      invoice.tax === undefined ||
      invoice.tax === null ||
      invoice.totalAmount === undefined ||
      invoice.totalAmount === null ||
      !invoice.date
    ) {
      return true;
    }

    // Check Customer fields
    if (
      !customer.name ||
      !customer.phoneNumber ||
      !customer.email ||
      !customer.address ||
      customer.totalPurchaseAmount === undefined ||
      customer.totalPurchaseAmount === null
    ) {
      return true;
    }

    // Check Products
    if (!products || !Array.isArray(products) || products.length === 0) {
      return true;
    }

    // Check each product for missing fields
    for (const product of products) {
      if (
        !product.name ||
        product.quantity === undefined ||
        product.quantity === null ||
        product.unitPrice === undefined ||
        product.unitPrice === null ||
        product.tax === undefined ||
        product.tax === null ||
        product.priceWithTax === undefined ||
        product.priceWithTax === null
      ) {
        return true;
      }
    }

    // No missing data found
    return false;
  }

  function productNames(products: Product[]) {
    const names = products
      .map((product) => product.name?.trim())
      .filter((name) => name) // Filter out empty names
      .join(",");

    return names || "not found";
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setLoading(true);
      // Clear any previous missing data
      setMissingDataItems([]);
      setShowMissingDataModal(false);

      try {
        setLoading(true);
        
        let allMissingItems: MissingDataItem[] = [];
        
        const filePromises = acceptedFiles.map(async (file) => {
          const data = await processFile(file);
          const fileResults: {
            missingItems: MissingDataItem[],
            validItems: {invoice: Invoice, product: Product[], customer: Customer}[]
          } = {
            missingItems: [],
            validItems: []
          };
          
          data.data.forEach((item: any) => {
            const invoice: Invoice = {
              serialNumber: item.serialNumber,
              customerName: item.customerName,
              productName: productNames(item.products),
              quantity: item.quantity,
              tax: item.tax,
              totalAmount: item.totalAmount,
              date: item.date,
            };
      
            const product: Product[] = item.products;
      
            const customer: Customer = {
              name: item.customerName,
              phoneNumber: item.customerPhone,
              totalPurchaseAmount: item.totalAmount,
              email: item.customerEmail,
              address: item.address,
            };
      
            // Check if data is missing
            if (checkMissingData(invoice, customer, product)) {
              // Add to missing data array
              fileResults.missingItems.push({
                serialNumber: item.serialNumber || "",
                customerName: item.customerName || "",
                quantity: item.quantity || 0,
                tax: item.tax || 0,
                totalAmount: item.totalAmount || 0,
                date: item.date || "",
                product,
                customer,
              });
            } else {
              // Data is complete, collect for dispatch
              fileResults.validItems.push({ invoice, product, customer });
            }
          });
          
          return fileResults;
        });
        
        // Execute all file processing in parallel and wait for completion
        const results = await Promise.all(filePromises);
        
        // Combine all results
        results.forEach(result => {
          // Add missing items
          allMissingItems = [...allMissingItems, ...result.missingItems];
          
          // Dispatch all valid items to store
          result.validItems.forEach(({ invoice, product, customer }) => {
            dispatch(addInvoice(invoice));
            dispatch(addProducts(product));
            dispatch(addCustomer(customer));
          });
        });
        

        setLoading(false);
      
        if (allMissingItems.length > 0) {
          // Set missing data and show modal
          setMissingDataItems(allMissingItems);
          setShowMissingDataModal(true);
        }
      
        toast.success("Files processed successfully!");
      } catch (error) {
        setLoading(false);
        toast.error("Error processing files. Please try again.");
      }
    },
    [dispatch]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  return (
    <>
      <MissingDataModal
        missingData={missingDataItems.length > 0 ? missingDataItems : []}
        isOpen={showMissingDataModal}
        onClose={() => setShowMissingDataModal(false)}
        onComplete={handleComplete}
      />

      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <input {...getInputProps()} />
        {loading ? (
          <Loader2 className="mx-auto animate-spin h-12 w-12 text-gray-400" />
        ) : (
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
        )}
        {loading ? (
          <p className="text-xs text-gray-500 mt-1">Processing Files...</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? "Drop the files here..."
                : "Drag 'n' drop files here, or click to select files"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports PDF, Images (PNG, JPG), and Excel files
            </p>
          </>
        )}
      </div>
    </>
  );
}

export default FileUpload;
