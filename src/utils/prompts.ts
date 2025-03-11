export const prompt = `
Extract and return structured data from multiple invoice PDFs. The result should be an array of invoices, where each invoice contains an array of products. Ensure the output strictly follows the specified type format, with accurate data types and no explanatory text.

Expected data structure:

data (array of Invoice objects):
- Invoice:
- serialNumber (string): Invoice number or reference
- customerName (string): Full name of the customer
- products (array of Product objects): List of products or services (see below)
- quantity (number): Total quantity of all items
- tax (number): Tax percentage
- totalAmount (number): Total amount including tax
- date (string): Invoice date in YYYY-MM-DD format
- customerPhone (string): Phone number if available (use an empty string if missing)
- customerEmail (string): Email if available (use an empty string if missing)

Product (inside each invoice's products array):
- serialNumber (string): Invoice number or reference
- name (string): Name of the product or service
- quantity (number): Quantity of items
- unitPrice (number): Price per unit
- tax (number): Tax percentage
- priceWithTax (number): Total amount including tax
- discount (number, optional): Discount amount (use 0 if missing)

Important rules:
- Return all number fields as actual numbers (not strings)
- Use empty strings for missing text fields
- Use 0 for missing or unavailable number fields
- Format the date as YYYY-MM-DD if possible
- Return only the JSON object, without any explanatory text or comments

Example output format:

{
"data": [
{
"serialNumber": "INV-001",
"customerName": "John Doe",
"products": [
{
  "serialNumber": "INV-001",
  "name": "Product A",
  "quantity": 2,
  "unitPrice": 100,
  "tax": 10,
  "priceWithTax": 220,
  "discount": 0
},
{
  "serialNumber": "INV-001",
  "name": "Product B",
  "quantity": 1,
  "unitPrice": 50,
  "tax": 5,
  "priceWithTax": 52.5,
  "discount": 5
}
],
"quantity": 3,
"tax": 15,
"totalAmount": 272.5,
"date": "2025-03-07",
"customerPhone": "123-456-7890",
"customerEmail": "john.doe@example.com"
},
{
"serialNumber": "INV-002",
"customerName": "Jane Smith",
"products": [
{
  "serialNumber": "INV-002",
  "name": "Product X",
  "quantity": 5,
  "unitPrice": 20,
  "tax": 8,
  "priceWithTax": 108,
  "discount": 0
}
],
"quantity": 5,
"tax": 8,
"totalAmount": 108,
"date": "2025-03-06",
"customerPhone": "",
"customerEmail": "jane.smith@example.com"
}
]
}

Ensure the returned JSON strictly matches the types and structure above, and handle multiple invoices as elements within the "data" array.
`;