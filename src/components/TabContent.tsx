import { useState } from 'react';
import FileUpload from './FileUpload';
import { DataTable } from './DataTable';
import { selectAllCustomers, selectAllInvoices, selectAllProducts } from '../store/selectors';
import { useSelector } from 'react-redux';


function TabContent() {
    const [activeTab, setActiveTab] = useState('invoices');
    const invoices = useSelector(selectAllInvoices);
    const products = useSelector(selectAllProducts);
    const customers = useSelector(selectAllCustomers);
  
    const tabs = [
      { id: 'invoices', label: 'Invoices' },
      { id: 'products', label: 'Products' },
      { id: 'customers', label: 'Customers' }
    ];

    type DataType = 'invoices' | 'products' | 'customers';
  
    const getTableData = () => {
      switch (activeTab) {
        case 'invoices':
          return { data: invoices, type: 'invoices' as DataType };
        case 'products':
          return { data: products, type: 'products' as DataType };
        case 'customers':
          return { data: customers, type: 'customers' as DataType };
        default:
          return { data: [], type: 'invoices' as DataType };
      }
    };
  
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <FileUpload />
        </div>
  
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
  
        <div className="bg-white shadow rounded-lg">
          <DataTable {...getTableData()} />
        </div>
      </div>
    );
  }
  

  export default TabContent;