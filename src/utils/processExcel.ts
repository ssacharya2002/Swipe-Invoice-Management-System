import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function processExcel(file: File): Promise<any> {
    try {
        const { mappings, headerRow } = await determineColumnMappings(file);
        const structuredData = await processEntireFile(file, mappings, headerRow);
        return { data: structuredData };
    } catch (error) {
        throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function determineColumnMappings(file: File): Promise<{ mappings: Record<string, number>, headerRow: number }> {
    try {
        const { worksheet } = await readExcelFile(file);
        const headerRow = findHeaderRow(worksheet);
        const sampleData = getFirstNRows(worksheet, headerRow, 10);
        const sampleCSV = XLSX.utils.sheet_to_csv(sampleData);
        const base64SampleCSV = btoa(unescape(encodeURIComponent(sampleCSV)));

        const mappingPrompt = `
        Analyze this CSV data which contains invoice information. 
        The first row is the header row.
        
        I need you to map each column to the appropriate field in our data structure.
        
        Return a JSON object that maps field names to column indices (0-based).
        For example: {"serialNumber": 0, "customerName": 2, ...}
        
        Here are the fields we need to map:
        - serialNumber: Invoice number
        - customerName: Customer name
        - quantity: Total quantity
        - tax: Tax percentage/amount
        - totalAmount: Total invoice amount
        - date: Invoice date
        - customerPhone: Customer phone
        - customerEmail: Customer email
        - product.name: Product name
        - product.quantity: Product quantity
        - product.unitPrice: Unit price
        - product.tax: Product tax
        - product.priceWithTax: Price with tax
        - product.discount: Discount amount
        
        Only return a valid JSON object with the mappings, nothing else.
        If you can't find a mapping for a field, don't include it in the JSON.
        `;

        const result = await model.generateContent([
            mappingPrompt,
            { inlineData: { data: base64SampleCSV, mimeType: 'text/csv' } }
        ]);

        const response = result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in the column mapping response');
        }

        const fieldToColumnMapping = JSON.parse(jsonMatch[0]);
        const mappings: Record<string, number> = {};
        for (const [field, index] of Object.entries(fieldToColumnMapping)) {
            mappings[field] = index as number;
        }

        return { mappings, headerRow };
    } catch (error) {
        throw new Error(`Failed to determine column mappings: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function findHeaderRow(worksheet: XLSX.WorkSheet): number {
    // Look for rows that might contain common invoice header terms
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const headerTerms = ['invoice', 'customer', 'product', 'quantity', 'amount', 'date', 'price'];
    
    for (let r = range.s.r; r <= Math.min(range.s.r + 5, range.e.r); r++) {
        let headerTermCount = 0;
        
        for (let c = range.s.c; c <= range.e.c; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            const cellValue = worksheet[cellRef]?.v;
            
            if (cellValue && typeof cellValue === 'string') {
                const lowerCellValue = cellValue.toLowerCase();
                if (headerTerms.some(term => lowerCellValue.includes(term))) {
                    headerTermCount++;
                }
            }
        }
        
        if (headerTermCount >= 3) {
            return r;
        }
    }
    
    return range.s.r;
}

function getFirstNRows(worksheet: XLSX.WorkSheet, startRow: number, rowCount: number): XLSX.WorkSheet {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const newWorksheet: XLSX.WorkSheet = {};
    
    const newRange = {
        s: { r: startRow, c: range.s.c },
        e: { r: Math.min(startRow + rowCount - 1, range.e.r), c: range.e.c }
    };
    
    for (let r = newRange.s.r; r <= newRange.e.r; r++) {
        for (let c = newRange.s.c; c <= newRange.e.c; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            if (worksheet[cellRef]) {
                newWorksheet[cellRef] = worksheet[cellRef];
            }
        }
    }
    
    newWorksheet['!ref'] = XLSX.utils.encode_range(newRange);
    
    return newWorksheet;
}

async function processEntireFile(file: File, mappings: Record<string, number>, headerRow: number): Promise<any[]> {
    try {
        const { worksheet } = await readExcelFile(file);
        
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        const headers: string[] = [];
        
        for (let c = range.s.c; c <= range.e.c; c++) {
            headers.push(c.toString());
        }
        
        const rows: any[] = [];
        for (let r = headerRow + 1; r <= range.e.r; r++) {
            const row: Record<string, any> = {};
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cellRef = XLSX.utils.encode_cell({ r, c });
                if (worksheet[cellRef]) {
                    row[c.toString()] = getCellValue(worksheet[cellRef]);
                }
            }
            rows.push(row);
        }
        
        return transformDataWithMappings(rows, mappings);
    } catch (error) {
        throw new Error(`Failed to process entire file: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function getCellValue(cell: XLSX.CellObject): any {
    // Handle different cell types properly
    switch (cell.t) {
        case 'd': // date
            return cell.w || '';
        case 'n': // number
            return cell.v;
        case 'b': // boolean
            return cell.v;
        case 's': // string
        default:
            return cell.v || '';
    }
}

function transformDataWithMappings(rows: any[], mappings: Record<string, number>): any[] {
    const invoiceMap = new Map();
    
    rows.forEach(row => {
        const serialNumber = extractStringValue(row, mappings['serialNumber']);
        if (!serialNumber) {
            //Row missing serial number skipping row
            return;
        }
        
        if (!invoiceMap.has(serialNumber)) {
            invoiceMap.set(serialNumber, {
                serialNumber: serialNumber,
                customerName: extractStringValue(row, mappings['customerName']),
                products: [],
                quantity: 0,
                tax: extractNumberValue(row, mappings['tax']),
                totalAmount: extractNumberValue(row, mappings['totalAmount']),
                date: formatDate(extractStringValue(row, mappings['date'])),
                customerPhone: extractStringValue(row, mappings['customerPhone']),
                customerEmail: extractStringValue(row, mappings['customerEmail'])
            });
        }
        
        const invoice = invoiceMap.get(serialNumber);
        
        const productName = extractStringValue(row, mappings['product.name']);
        if (productName) {
            const quantity = extractNumberValue(row, mappings['product.quantity']);
            
            const product = {
                serialNumber: serialNumber,
                name: productName,
                quantity: quantity,
                unitPrice: extractNumberValue(row, mappings['product.unitPrice']),
                tax: extractNumberValue(row, mappings['product.tax']),
                priceWithTax: extractNumberValue(row, mappings['product.priceWithTax']),
                discount: extractNumberValue(row, mappings['product.discount'])
            };
            
            invoice.products.push(product);
            invoice.quantity += quantity;
        }
    });
    
    return Array.from(invoiceMap.values()).map(invoice => ({
        ...invoice,
        product: invoice.products
    }));
}

function extractStringValue(row: any, colIndex: number | undefined): string {
    if (colIndex === undefined || row[colIndex.toString()] === undefined) return '';
    return String(row[colIndex.toString()]);
}

function extractNumberValue(row: any, colIndex: number | undefined): number {
    if (colIndex === undefined || row[colIndex.toString()] === undefined) return 0;
    const val = parseFloat(row[colIndex.toString()]);
    return isNaN(val) ? 0 : val;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        const dateFormats = [
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
            /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
            /(\d{4})-(\d{1,2})-(\d{1,2})/ // YYYY-MM-DD
        ];
        
        for (const format of dateFormats) {
            const match = dateStr.match(format);
            if (match) {
                if (format === dateFormats[0]) {
                    const month = parseInt(match[1]);
                    const day = parseInt(match[2]);
                    const year = parseInt(match[3]);
                    const date = new Date(year, month - 1, day);
                    return date.toISOString().split('T')[0];
                } else if (format === dateFormats[1] || format === dateFormats[2]) {
                    const day = parseInt(match[1]);
                    const month = parseInt(match[2]);
                    const year = parseInt(match[3]);
                    const date = new Date(year, month - 1, day);
                    return date.toISOString().split('T')[0];
                } else if (format === dateFormats[3]) {
                    const year = parseInt(match[1]);
                    const month = parseInt(match[2]);
                    const day = parseInt(match[3]);
                    const date = new Date(year, month - 1, day);
                    return date.toISOString().split('T')[0];
                }
            }
        }
        
        return dateStr;
    } catch (e) {
        return dateStr;
    }
}

async function readExcelFile(file: File): Promise<{ workbook: XLSX.WorkBook, worksheet: XLSX.WorkSheet }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                
                if (workbook.SheetNames.length === 0) {
                    reject(new Error("Excel file contains no sheets"));
                    return;
                }
                
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                resolve({ workbook, worksheet });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

export { processExcel };