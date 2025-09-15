import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { ChevronRight, BarChart3, TrendingUp, ReceiptIndianRupee } from "lucide-react"
import useFetchData from "../../hooks/useFetchData";
import { Input } from "../../components/ui/input";
import { useSnackbar } from "notistack"
import { usePostData } from "../../hooks/usePostData";
import { Autocomplete, TextField } from "@mui/material"

const reportTypes = [
    {
        id: 1,
        title: "Inmate Balance Report",
        description: "Current balances for all inmates",
        apiUrl: 'reports/intimate-balance-report'
    },
    {
        id: 2,
        title: "Transaction Summary",
        description: "Daily, weekly, monthly summaries",
        apiUrl: 'reports/transaction-summary-report'
    },
    {
        id: 3,
        title: "Tuck Shop Sales",
        description: "Revenue and item sales data",
        apiUrl: 'reports/tuckshop-sales-report'
    },
    {
        id: 4,
        title: "Wage Distribution",
        description: "Total wages paid by department",
        apiUrl: 'reports/wage-distribution-report'
    },
]

function Reports() {

    const { enqueueSnackbar } = useSnackbar();

    const [selectedDateRange, setSelectedDateRange] = useState("")
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");
    const [selectedFormat, setSelectedFormat] = useState("csv")
    const [selectedDepartment, setSelectedDepartment] = useState("")
    const [apiUrl, setApiUrl] = useState(reportTypes[0])
    const [refetch, setRefectch] = useState(0);
    const [selectedInmateItem, setSelectedInmateItem] = useState()

    const { data: inmate } = useFetchData("inmate", refetch, null, true);
    const { data: quickStatistics, error } = useFetchData("reports/quick-statistics");
    const { data: department } = useFetchData("department");


    const payLoad =
        selectedDateRange === "custom"
            ? {
                startDate: customStartDate,
                endDate: customEndDate,
                format: selectedFormat,
                department: selectedDepartment,
            }
            : {
                dateRange: selectedDateRange,
                format: selectedFormat,
                department: selectedDepartment
            };

    const transactionPayload = {
        dateRange: selectedDepartment,
        format: selectedFormat,
    }

    const inmatePayload = {
        inmateId: selectedInmateItem?.inmateId || null,
        ...payLoad
    }

    useEffect(() => {
        setSelectedDateRange("")
        setCustomStartDate("")
        setCustomEndDate("")
        setSelectedFormat("csv")
        setSelectedDepartment("")
        setSelectedInmateItem()
    }, [apiUrl]);

    async function postData() {
        const url = apiUrl?.apiUrl;
        const method = "post";

        const { data, error } = await usePostData(url, apiUrl.id === 1 ? inmatePayload : apiUrl.id === 2 ? transactionPayload : payLoad, method);

        let reportsName =
        apiUrl.id === 1 && selectedInmateItem?.inmateId ? `Inmate_${selectedInmateItem?.inmateId}_report` :
        apiUrl.id === 1 && !selectedInmateItem?.inmateId ? "Inmate_Report" :
        apiUrl.id === 2 ? "Transaction_Report" :
        apiUrl.id === 3 ? "Tuck_Shop_Sales_Report" :
        apiUrl.id === 4 ? "Wage_Distribution_Report" :
        "Report";

        if (error) {
            enqueueSnackbar(error?.response?.data?.message || "Error generating report", {
                variant: "error",
            });
        } else {
            const responseData = data?.data;

            if (selectedFormat === "csv" && typeof responseData === "string") {
                const blob = new Blob([responseData], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `${reportsName}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                enqueueSnackbar("Report generated successfully", {
                    variant: "success",
                });
            }
        }
    }

    return (
        <div className="w-full bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-8xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Financial Reports</h1>
                    <p className="text-gray-600 text-sm md:text-base">Generate and view comprehensive financial reports</p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Report Types */}
                    <Card className="lg:col-span-1  border border-[#3498db]">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Report Types</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {reportTypes.map((report, index) => (
                                <div
                                    key={index}
                                    onClick={() => setApiUrl(report)}
                                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${report.id === apiUrl?.id ? "border-blue-500" : "border-gray-200"
                                        }`}
                                >
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 text-sm md:text-base">{report.title}</h3>
                                        <p className="text-xs md:text-sm text-gray-500 mt-1">{report.description}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Report Parameters */}
                    <Card className="lg:col-span-1  border border-[#3498db]">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Report Parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {apiUrl?.id === 2 && <> <label className="block text-sm font-medium text-gray-700 mb-2">Filter by frequency</label>
                                <Select
                                    value={selectedDepartment}
                                    onValueChange={setSelectedDepartment}
                                    className="mt-1 border border-blue-500 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-blue-500"
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Frequency" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </>}
                            {apiUrl?.id !== 2 && <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date Range
                                </label>
                                <Select
                                    value={selectedDateRange}
                                    onValueChange={(value) => {
                                        setSelectedDateRange(value);
                                        if (value !== "custom") {
                                            setCustomStartDate("");
                                            setCustomEndDate("");
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full border border-blue-500 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-blue-500">
                                        <SelectValue placeholder="Select date range" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                        <SelectItem value="7daysago">Last 7 days</SelectItem>
                                        <SelectItem value="1monthago">Last 30 days</SelectItem>
                                        <SelectItem value="3monthsago">Last 90 days</SelectItem>
                                        <SelectItem value="custom">Custom range</SelectItem>
                                    </SelectContent>
                                </Select>

                                {selectedDateRange === "custom" && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={customStartDate}
                                                onChange={(e) => setCustomStartDate(e.target.value)}
                                                className="w-full border border-gray-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={customEndDate}
                                                onChange={(e) => setCustomEndDate(e.target.value)}
                                                className="w-full border border-gray-300"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                                <Select value={selectedFormat} onValueChange={setSelectedFormat} className="mt-1 border border-blue-500 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-blue-500">
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select format" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="excel">Excel</SelectItem>
                                        <SelectItem value="csv">CSV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {apiUrl?.id === 1 && <div>
                                <Autocomplete
                                    options={inmate}
                                    getOptionLabel={(option) => `${option?.firstName} ${option?.lastName} - ${option?.inmateId}`}
                                    onChange={(event, newValue) => {
                                        setSelectedInmateItem(newValue);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            size="small"
                                            label="Select inmate"
                                            variant="outlined"
                                            fullWidth
                                        />
                                    )}
                                />
                                <span className="mt-2 block">{selectedInmateItem?.custodyType && <p className="text-red-400 ">Custody Type : {selectedInmateItem?.custodyType}</p>}</span>
                            </div>}

                            <div>
                                {apiUrl?.id === 4 && <> <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
                                    <Select
                                        onValueChange={(value) => setSelectedDepartment(value)}
                                        value={selectedDepartment}
                                    >
                                        <SelectTrigger className="mt-1 w-full">
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* All Departments option */}
                                            <SelectItem value="all">All Departments</SelectItem>

                                            {/* Dynamic department list */}
                                            {department?.map((item) => (
                                                <SelectItem key={item._id} value={item._id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </>}
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6"
                                onClick={postData}
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Generate Report
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Statistics */}
                    <Card className="lg:col-span-1  border border-[#3498db]">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Quick Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Total System Balance</p>
                                    <p className="text-xl md:text-2xl font-bold text-gray-900">{quickStatistics?.totalSystemBalance}</p>
                                </div>
                                <div className={`p-2 rounded-lg bg-blue-50 flex-shrink-0 ml-3`}>
                                    <BarChart3 className={`h-5 w-5 md:h-6 md:w-6 text-blue-600`} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Monthly Wages Paid</p>
                                    <p className="text-xl md:text-2xl font-bold text-gray-900">{quickStatistics?.monthlyWagesPaid}</p>
                                </div>
                                <div className={`p-2 rounded-lg bg-blue-50 flex-shrink-0 ml-3`}>
                                    <ReceiptIndianRupee className={`h-5 w-5 md:h-6 md:w-6 text-blue-600`} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">Monthly Deposits</p>
                                    <p className="text-xl md:text-2xl font-bold text-gray-900">{quickStatistics?.monthluyDeposits}</p>
                                </div>
                                <div className={`p-2 rounded-lg bg-blue-50 flex-shrink-0 ml-3`}>
                                    <TrendingUp className={`h-5 w-5 md:h-6 md:w-6 text-blue-600`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Mobile-specific adjustments */}
                <div className="block lg:hidden mt-6">
                    <div className="text-center text-sm text-gray-500">
                        Swipe or scroll horizontally to view all sections on mobile devices
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Reports