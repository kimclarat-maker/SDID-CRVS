/*

A function that can fetch data from the server

Export format: PDF, CSV, JSON

Export All or with page and limit

Export data in chunk and show loading progress

*/

import { useState } from "react";
import { saveAs } from "file-saver";
import { jsonToCSV } from "react-papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const useExportData = () => {
  const [exporting, setExporting] = useState<boolean>(false);

  const exportToCSV = (data: any[], filename: string) => {
    const csv = jsonToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
  };

  const exportToJSON = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    saveAs(blob, `${filename}.json`);
  };

  const exportToPDF = (data: any[], columns: string[], filename: string) => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [columns],
      body: data.map((row) => columns.map((column) => row[column])),
    });
    doc.save(`${filename}.pdf`);
  };

  const exportData = ({
    data,
    filename,
    columns,
    format,
  }: {
    data: any[];
    format: string;
    filename: string;
    columns?: string[];
  }) => {
    setExporting(true);
    switch (format) {
      case "csv":
        exportToCSV(data, filename);
        break;
      case "json":
        exportToJSON(data, filename);
        break;
      case "pdf":
        columns && exportToPDF(data, columns, filename);
        break;
      default:
        break;
    }
    setExporting(false);
  };

  return { exporting, exportData };
};

export default useExportData;
