import React, { useState } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { BASE_URL } from '../../util';
import { toast } from 'react-toastify';

const XlMigration = ({ isOpen, onClose }) => {
  // Excel import states
  const [excelFile, setExcelFile] = useState(null);
  const [excelImportLoading, setExcelImportLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);

  // Function to handle Excel file selection
  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }

      setExcelFile(file);
    }
  };

  // Function to handle Excel import
  const handleExcelImport = async () => {
    if (!excelFile) {
      toast.error('Please select an Excel file first');
      return;
    }

    setExcelImportLoading(true);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append('excel', excelFile);

      const response = await axios.post(`${BASE_URL}/api/products/import-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setImportResults(response.data.results);
        toast.success(`Import completed! ${response.data.results.successful} products imported successfully.`);

        if (response.data.results.failed > 0) {
          toast.warning(`${response.data.results.failed} products failed to import. Check the results for details.`);
        }
      } else {
        toast.error(response.data.message || 'Import failed');
      }
    } catch (error) {
      console.error('Excel import error:', error);

      let errorMessage = 'Error importing Excel file';
      if (error.response?.status === 404) {
        errorMessage = 'Import endpoint not found. Please check if the server is running.';
      } else if (error.response?.status === 500) {
        errorMessage = `Server error: ${error.response?.data?.message || 'Internal server error'}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setExcelImportLoading(false);
    }
  };



  // Function to close modal and reset state
  const closeModal = () => {
    setExcelFile(null);
    setImportResults(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Import Products from Excel</h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelFileChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            {excelFile && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {excelFile.name}
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Download the template first to see the required format</li>
              <li>• Fill in all required fields: productname, brand, price, category, subcategory</li>
              <li>• Use category and subcategory IDs (numbers) - check the reference sheets in the template</li>
              <li>• Specifications should be in JSON format</li>
              <li>• Sizes should be in JSON array format</li>
            </ul>
            <div className="mt-2">
              <button
                onClick={() => window.open(`${BASE_URL}/api/products/import-reference`, '_blank')}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                View Available Categories & Subcategories
              </button>
            </div>
          </div>

          {importResults && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Import Results:</h4>
              <div className="text-xs space-y-1">
                <p className="text-green-600">✓ Successful: {importResults.successful}</p>
                <p className="text-red-600">✗ Failed: {importResults.failed}</p>
                <p className="text-gray-600">Total: {importResults.total}</p>
              </div>

              {importResults.errors && importResults.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
                  {importResults.errors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-xs text-red-600">
                      Row {error.row}: {error.error}
                    </p>
                  ))}
                  {importResults.errors.length > 5 && (
                    <p className="text-xs text-gray-500">
                      ... and {importResults.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            disabled={excelImportLoading}
          >
            Close
          </button>
          <button
            onClick={handleExcelImport}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center gap-2"
            disabled={excelImportLoading || !excelFile}
          >
            {excelImportLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Products
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Standalone function for downloading Excel template (can be used outside the modal)
export const downloadExcelTemplate = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/products/excel-template`, {
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'product_import_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Template downloaded successfully!');
  } catch (error) {
    console.error('Template download error:', error);
    toast.error(`Error downloading template: ${error.response?.status || error.message}`);
  }
};

export default XlMigration;