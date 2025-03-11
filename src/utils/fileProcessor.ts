import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import toast from "react-hot-toast";
import * as XLSX from 'xlsx';
import { prompt } from "./prompts";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


async function processFile(file: File) {
    const fileType = file.type;
    let extractedData;

    try {
        if (fileType.includes('pdf')) {
            extractedData = await processPdfOrImage(file);
        } else if (fileType.includes('image')) {
            extractedData = await processPdfOrImage(file);
        }
        else if (fileType.includes('sheet') || fileType.includes('excel')) {
            extractedData = await processExcel(file);
        }
        else {
            toast.error('Unsupported file type');
            throw new Error('Unsupported file type');
        }

    } catch (error) {
        console.error('File processing error:', error);
        throw new Error(`Failed to process file: ${error}`);
    }

    return extractedData;
}


async function processPdfOrImage(file: File): Promise<any> {
    
    try {
        // Convert to base64
        const base64String: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = () => {
                if (reader.result !== null) {
                    const base64String = (reader.result as string).split(',')[1];
                    resolve(base64String);
                } else {
                    toast.error('Failed to read file');
                    reject(new Error('Failed to read file'));
                }
            };
            reader.onerror = reject;
        })

        // Create the image part for the model
        const imagePart: Part = {
            inlineData: {
                data: base64String,
                mimeType: file.type
            }
        };


        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in the response');
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        return parsedData;
    } catch (error) {
        toast.error('Failed to process file');
    };
}


async function processExcel(file: File): Promise<any> {
    
    try {

        const base64CSV = await convertExcelToBase64CSV(file);
        const result = await model.generateContent([prompt, { inlineData: { data: base64CSV, mimeType: 'text/csv' } }]);

        const response = result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in the response');
        }

        const parsedData = JSON.parse(jsonMatch[0]);

        return parsedData;
    } catch (error) {
        throw new Error('Failed to process Excel');
    }

}



export const convertExcelToBase64CSV = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const csv = XLSX.utils.sheet_to_csv(worksheet);

            const base64CSV = btoa(unescape(encodeURIComponent(csv)));
            resolve(base64CSV);
        };

        reader.onerror = (error) => reject(error);

        reader.readAsArrayBuffer(file);
    });
};




export { processFile };