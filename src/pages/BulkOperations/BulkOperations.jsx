import { useState, useRef } from "react"
import { Button } from "../../components/UI/button"
import { Textarea } from "../../components/UI/textarea"
import { Card, CardContent } from "../../components/UI/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/UI/tabs"
import { Alert, AlertDescription } from "../../components/UI/alert"
import { Users, CreditCard, Download, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { usePostData } from "../../hooks/usePostData"
import { enqueueSnackbar } from "notistack"

export default function BulkOperations() {
    const [activeTab, setActiveTab] = useState("bulk-add-inmates")
    const [csvData, setCsvData] = useState("")
    const [selectedInamteFile, setSelectedInmateFile] = useState(null)
    const [selectedWageFile, setSelectedWageFile] = useState(null)
    const [validationErrors, setValidationErrors] = useState([])
    const [successMessage, setSuccessMessage] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [processedData, setProcessedData] = useState([])
    const [processedWageData, setProcessedWageData] = useState([])
    const inmateInputRef = useRef(null)
    const wageInputRef = useRef(null)
    const locationRaw = localStorage.getItem("location");
    const location = locationRaw ? JSON.parse(locationRaw) : null;

    const downloadSampleCSV = async () => {
        const token = localStorage.getItem('authToken');

        const apiUrl =
            activeTab === 'bulk-add-inmates'
                ? `${import.meta.env.VITE_API_URL}inmate/download-csv/${location?._id}`
                : `${import.meta.env.VITE_API_URL}financial/wages/download-csv/${location?._id}`;

        const fileName =
            activeTab === 'bulk-add-inmates' ? 'sample_inmates.csv' : 'sample_wages.csv';

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                let errorMessage = 'Failed to fetch CSV file';
                try {
                    const errorData = await response.json();
                    if (errorData?.message) {
                        errorMessage = errorData.message;
                    }
                } catch {
                    // Fallback: read plain text error
                    const textError = await response.text();
                    if (textError) {
                        errorMessage = textError;
                    }
                }

                enqueueSnackbar(errorMessage, { variant: 'error' });
                return;
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download the CSV file. Please try again.');
        }
    };

    const handleInmateFileUpload = async (e) => {
        e.preventDefault();
        const file = e.target.files?.[0]
        setSelectedInmateFile(file)

        if (!file) {
            enqueueSnackbar("Please select a file.", { variant: 'error' });
            return;
        }
        const formData = new FormData();
        formData.append('location', location?._id);
        formData.append('file', file);

        try {
            const response = await usePostData("bulk-oprations/inmates", formData);

            const { data: payload, error } = response || {};

            if (error || !payload?.data?.success) {
                enqueueSnackbar("Upload failed.", { variant: 'error' });
            } else {
                const { created = [], updated = [], failed = [] } = payload.data.results || {};
                enqueueSnackbar(`Upload successful. Created: ${created.length}, Updated: ${updated.length}, Failed: ${failed.length}`, { variant: 'success' });
                if (failed.length > 0) {
                    console.warn("Failed records:", failed);
                }
            }
        } catch (err) {
            console.error("Upload failed:", err);
            enqueueSnackbar("Upload failed. Check console for details.", { variant: 'error' });
        } finally {
            setSelectedInmateFile(null);
            if (inmateInputRef.current) {
                inmateInputRef.current.value = null; // Clear the file input
            }
        }
    }

    const handleWagesFileUpload = async (e) => {
        e.preventDefault();
        const file = e.target.files?.[0]
        setSelectedWageFile(file)

        if (!file) {
            enqueueSnackbar('Please select a file first.', { variant: 'error' });
            return;
        }

        const formData = new FormData();
        formData.append('location', location?._id);
        formData.append('file', file);

        try {
            const { data: payload, error } = await usePostData("bulk-oprations/wages", formData);
            if (error || !payload?.data?.success) {
                enqueueSnackbar("Upload failed.", { variant: 'error' });
            } else {
                const { created = [], skipped = [], failed = [] } = payload.data.results || {};
                enqueueSnackbar(`Upload successful. Created: ${created.length}, Skipped: ${skipped.length}, Failed: ${failed.length}`, { variant: 'success' });
                if (failed.length > 0) {
                    console.warn("Failed records:", failed);
                }
            }
        } catch (err) {
            console.error('Upload failed:', err);
            enqueueSnackbar('Upload failed. Check console for details.', { variant: 'error' });
        } finally {
            setSelectedWageFile(null)
            if (wageInputRef.current) {
                wageInputRef.current.value = null;
            }
        }
    };


    const validateCSVData = (data) => {
        const errors = []
        const parsedData = []

        if (!data.trim()) {
            errors.push({ row: 0, field: "general", message: "CSV data is empty" })
            return { isValid: false, errors, parsedData }
        }

        const lines = data.trim().split("\n")
        if (lines.length < 2) {
            errors.push({ row: 0, field: "general", message: "CSV must contain at least a header and one data row" })
            return { isValid: false, errors, parsedData }
        }

        const headers = lines[0].split(",").map((h) => h.trim())
        const expectedHeaders = ["inmateNumber", "firstName", "lastName", "balance", "status"]

        // Validate headers
        if (!expectedHeaders.every((header) => headers.includes(header))) {
            errors.push({
                row: 0,
                field: "headers",
                message: `Headers must be exactly: ${expectedHeaders.join(", ")}`,
            })
            return { isValid: false, errors, parsedData }
        }

        // Validate data rows
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(",").map((cell) => cell.trim())
            const rowNumber = i + 1

            if (row.length !== expectedHeaders.length) {
                errors.push({
                    row: rowNumber,
                    field: "general",
                    message: `Row ${rowNumber}: Expected ${expectedHeaders.length} fields, got ${row.length}`,
                })
                continue
            }

            const [inmateNumber, firstName, lastName, balanceStr, status] = row

            // Validate required fields
            if (!inmateNumber) errors.push({ row: rowNumber, field: "inmateNumber", message: "Inmate number is required" })
            if (!firstName) errors.push({ row: rowNumber, field: "firstName", message: "First name is required" })
            if (!lastName) errors.push({ row: rowNumber, field: "lastName", message: "Last name is required" })
            if (!balanceStr) errors.push({ row: rowNumber, field: "balance", message: "Balance is required" })
            if (!status) errors.push({ row: rowNumber, field: "status", message: "Status is required" })

            // Validate balance
            const balance = parseFloat(balanceStr)
            if (isNaN(balance)) {
                errors.push({ row: rowNumber, field: "balance", message: "Balance must be a valid number" })
            }

            // Validate status
            if (status && !["active", "inactive"].includes(status)) {
                errors.push({ row: rowNumber, field: "status", message: 'Status must be either "active" or "inactive"' })
            }

            // If no errors for this row, add to parsed data
            if (!errors.some((error) => error.row === rowNumber)) {
                parsedData.push({
                    inmateNumber,
                    firstName,
                    lastName,
                    balance,
                    status,
                })
            }
        }

        return { isValid: errors.length === 0, errors, parsedData }
    }

    const validateWageCSVData = (data) => {
        const errors = []
        const parsedData = []

        if (!data.trim()) {
            errors.push({ row: 0, field: "general", message: "CSV data is empty" })
            return { isValid: false, errors, parsedData }
        }

        const lines = data.trim().split("\n")
        if (lines.length < 2) {
            errors.push({ row: 0, field: "general", message: "CSV must contain at least a header and one data row" })
            return { isValid: false, errors, parsedData }
        }

        const headers = lines[0].split(",").map((h) => h.trim())
        const expectedHeaders = ["inmateNumber", "wageAmount", "wageType", "paymentDate", "description"]

        // Validate headers
        if (!expectedHeaders.every((header) => headers.includes(header))) {
            errors.push({
                row: 0,
                field: "headers",
                message: `Headers must be exactly: ${expectedHeaders.join(", ")}`,
            })
            return { isValid: false, errors, parsedData }
        }

        // Validate data rows
        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(",").map((cell) => cell.trim())
            const rowNumber = i + 1

            if (row.length !== expectedHeaders.length) {
                errors.push({
                    row: rowNumber,
                    field: "general",
                    message: `Row ${rowNumber}: Expected ${expectedHeaders.length} fields, got ${row.length}`,
                })
                continue
            }

            const [inmateNumber, wageAmountStr, wageType, paymentDate, description] = row

            // Validate required fields
            if (!inmateNumber) errors.push({ row: rowNumber, field: "inmateNumber", message: "Inmate number is required" })
            if (!wageAmountStr) errors.push({ row: rowNumber, field: "wageAmount", message: "Wage amount is required" })
            if (!wageType) errors.push({ row: rowNumber, field: "wageType", message: "Wage type is required" })
            if (!paymentDate) errors.push({ row: rowNumber, field: "paymentDate", message: "Payment date is required" })
            if (!description) errors.push({ row: rowNumber, field: "description", message: "Description is required" })

            // Validate wage amount
            const wageAmount = parseFloat(wageAmountStr)
            if (isNaN(wageAmount) || wageAmount < 0) {
                errors.push({ row: rowNumber, field: "wageAmount", message: "Wage amount must be a positive number" })
            }

            // Validate wage type
            if (wageType && !["hourly", "daily", "bonus"].includes(wageType)) {
                errors.push({
                    row: rowNumber,
                    field: "wageType",
                    message: 'Wage type must be either "hourly", "daily", or "bonus"',
                })
            }

            // Validate payment date format
            if (paymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
                errors.push({ row: rowNumber, field: "paymentDate", message: "Payment date must be in YYYY-MM-DD format" })
            }

            // If no errors for this row, add to parsed data
            if (!errors.some((error) => error.row === rowNumber)) {
                parsedData.push({
                    inmateNumber,
                    wageAmount,
                    wageType,
                    paymentDate,
                    description,
                })
            }
        }

        return { isValid: errors.length === 0, errors, parsedData }
    }

    const processCSVData = async () => {
        setIsProcessing(true)
        setValidationErrors([])
        setSuccessMessage("")

        const validation = validateCSVData(csvData)

        if (!validation.isValid) {
            setValidationErrors(validation.errors)
            setIsProcessing(false)
            return
        }

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setProcessedData(validation.parsedData)
        setSuccessMessage(`Successfully processed ${validation.parsedData.length} inmates`)
        setIsProcessing(false)
    }

    const processWageCSVData = async () => {
        setIsProcessing(true)
        setValidationErrors([])
        setSuccessMessage("")

        const validation = validateWageCSVData(csvData)

        if (!validation.isValid) {
            setValidationErrors(validation.errors)
            setIsProcessing(false)
            return
        }

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setProcessedWageData(validation.parsedData)
        setSuccessMessage(`Successfully processed ${validation.parsedData.length} wage entries`)
        setIsProcessing(false)
    }

    const resetForm = () => {
        setCsvData("")
        setSelectedInmateFile(null)
        setSelectedWageFile(null)
        setValidationErrors([])
        setSuccessMessage("")
        setProcessedData([])
        setProcessedWageData([])
        if (inmateInputRef.current) {
            inmateInputRef.current.value = ""
        }
        if (wageInputRef.current) {
            wageInputRef.current.value = ""
        }
    }

    return (
        <div className="container mx-auto p-6 bg-white">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-2xl font-bold text-gray-900 mb-2">Bulk Operations</h1>
                <p className="text-gray-600">Upload CSV files to add multiple inmates or process wages in bulk</p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-6 border-b border-b-gray-200">
                    <TabsList className="bg-transparent p-0 h-auto">
                        <TabsTrigger
                            value="bulk-add-inmates"
                            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-600 rounded-none cursor-pointer"
                        >
                            <Users className="w-4 h-4" />
                            Bulk Add Inmates
                        </TabsTrigger>
                        <TabsTrigger
                            value="bulk-add-wages"
                            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-600 rounded-none cursor-pointer ml-8"
                        >
                            <CreditCard className="w-4 h-4" />
                            Bulk Add Wages
                        </TabsTrigger>
                    </TabsList>

                    <Button variant="outline" onClick={downloadSampleCSV} className="flex items-center gap-2 bg-transparent cursor-pointer mb-1">
                        <Download className="w-4 h-4" />
                        Download Sample CSV for {activeTab.split("-")[activeTab.split("-").length - 1].charAt(0).toUpperCase() + activeTab.split("-")[activeTab.split("-").length - 1].slice(1)}
                    </Button>
                </div>

                <TabsContent value="bulk-add-inmates">
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">Bulk Add Inmates</h2>

                        {/* CSV Format Requirements */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="px-4">
                                <h3 className="font-semibold text-blue-900 mb-4">CSV Format Requirements:</h3>
                                <ul className="space-y-2 text-blue-800">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>
                                            Headers: inmateNumber, firstName, lastName, balance, status
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>status should be either 'active' or 'inactive'</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>balance should be a number (can be 0)</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>All fields are required</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Upload Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Upload CSV File or Paste Data</h3>

                            <div className="flex items-center gap-4">
                                <input
                                    ref={inmateInputRef}
                                    type="file"
                                    // accept=".csv"
                                    onChange={handleInmateFileUpload}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => inmateInputRef.current?.click()}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Upload className="w-4 h-4" />
                                    Choose File
                                </Button>
                                <span className="text-gray-500">{selectedWageFile ? selectedWageFile.name : "No file chosen"}</span>
                            </div>

                            <Textarea
                                placeholder="Or paste CSV data here..."
                                value={csvData}
                                onChange={(e) => setCsvData(e.target.value)}
                                className="min-h-[200px] resize-none font-mono text-sm"
                            />

                            <div className="flex gap-4">
                                <Button
                                    onClick={processCSVData}
                                    disabled={!csvData.trim() || isProcessing}
                                    className="flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Process CSV Data
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={resetForm} disabled={isProcessing}>
                                    Reset
                                </Button>
                            </div>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    <div className="font-semibold mb-2">Validation Errors:</div>
                                    <ul className="space-y-1">
                                        {validationErrors.map((error, index) => (
                                            <li key={index} className="text-sm">
                                                {error.row > 0 ? `Row ${error.row}: ` : ""}
                                                {error.message}
                                            </li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Processed Data Preview */}
                        {processedData.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Processed Data Preview</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Inmate Number</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">First Name</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Last Name</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Balance</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {processedData.map((inmate, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-4 py-2">{inmate.inmateNumber}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{inmate.firstName}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{inmate.lastName}</td>
                                                        <td className="border border-gray-300 px-4 py-2">${inmate.balance.toFixed(2)}</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs ${inmate.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                                    }`}
                                                            >
                                                                {inmate.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="bulk-add-wages">
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900">Bulk Add Wages</h2>

                        {/* CSV Format Requirements for Wages */}
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="px-4">
                                <h3 className="font-semibold text-blue-900 mb-4">CSV Format Requirements:</h3>
                                <ul className="space-y-2 text-blue-800">
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>
                                            Header: inmateNumber, wageAmount, wageType, paymentDate, description
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>wageType should be either 'hourly', 'daily', or 'bonus'</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>wageAmount should be a positive number</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>paymentDate should be in YYYY-MM-DD format</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                        <span>All fields are required</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Upload Section for Wages */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Upload CSV File or Paste Data</h3>

                            <div className="flex items-center gap-4">
                                <input
                                    ref={wageInputRef}
                                    type="file"
                                    // accept=".csv"
                                    onChange={handleWagesFileUpload}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => wageInputRef.current?.click()}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Upload className="w-4 h-4" />
                                    Choose File
                                </Button>
                                <span className="text-gray-500">{selectedWageFile ? selectedWageFile.name : "No file chosen"}</span>
                            </div>

                            <Textarea
                                placeholder="Or paste CSV data here..."
                                value={csvData}
                                onChange={(e) => setCsvData(e.target.value)}
                                className="min-h-[200px] resize-none font-mono text-sm"
                            />

                            <div className="flex gap-4">
                                <Button
                                    onClick={processWageCSVData}
                                    disabled={!csvData.trim() || isProcessing}
                                    className="flex items-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Process CSV Data
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={resetForm} disabled={isProcessing}>
                                    Reset
                                </Button>
                            </div>
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                    <div className="font-semibold mb-2">Validation Errors:</div>
                                    <ul className="space-y-1">
                                        {validationErrors.map((error, index) => (
                                            <li key={index} className="text-sm">
                                                {error.row > 0 ? `Row ${error.row}: ` : ""}
                                                {error.message}
                                            </li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Processed Wage Data Preview */}
                        {processedWageData.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Processed Wage Data Preview</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Inmate Number</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Wage Amount</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Wage Type</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Payment Date</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {processedWageData.map((wage, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-4 py-2">{wage.inmateNumber}</td>
                                                        <td className="border border-gray-300 px-4 py-2">${wage.wageAmount.toFixed(2)}</td>
                                                        <td className="border border-gray-300 px-4 py-2">
                                                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 capitalize">
                                                                {wage.wageType}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2">{wage.paymentDate}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{wage.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
