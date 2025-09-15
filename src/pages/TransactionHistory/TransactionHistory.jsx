import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { useState } from "react"
import useFetchData from "../../hooks/useFetchData"
import { TablePagination } from "@mui/material"
import { Badge } from "../../components/ui/badge";
import { Label } from "@radix-ui/react-label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";

function TransactionHistory() {

    const [refetch, setRefetch] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [range, setRange] = useState('daily');
    const { data, error } = useFetchData(`transactions?range=${range}&page=${page + 1}&limit=${rowsPerPage}`, refetch, "true");

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        setRefetch(refetch + 1)
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setRefetch(refetch + 1)
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "text-green-600"
            case "inactive":
                return "text-gray-600"
            case "transfer":
                return "text-blue-600"
            case "released":
                return "text-purple-600"
            case "reversed":
                return "text-red-600"
            default:
                return "text-gray-600"
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <div className="min-h-screen w-full bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-8xl mx-auto space-y-6">

                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-2xl font-bold text-gray-900">Transaction History</h1>
                        <p className="text-gray-600 text-sm md:text-base">Monitor system statistics and recent activities</p>
                    </div>

                    <div>
                        <Label htmlFor="status"></Label>
                        <Select onValueChange={(value) => {
                            setRange(value);
                            setPage(0);
                            setRefetch(refetch + 1);
                        }}>
                            <SelectTrigger className="mt-1 border border-blue-500">
                                <SelectValue placeholder="Daily" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Inmate ID</TableHead>
                                <TableHead className="font-semibold">Items Purchased</TableHead>
                                <TableHead className="font-semibold">Categories</TableHead>
                                <TableHead className="font-semibold">Total Amount</TableHead>
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">Source</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.transactions?.length > 0 ? (
                                data.transactions.map((transaction) => {
                                    const categories = [...new Set(transaction?.products?.map((p) => p?.productId?.category))];
                                    const totalItems = transaction?.products?.reduce((sum, p) => sum + p?.quantity, 0);

                                    return (
                                        <TableRow key={transaction._id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">
                                                {transaction.inmateId || '-'} - <span className="text-red-400">{transaction.custodyType}</span>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                {transaction?.products && (
                                                    <div className="space-y-1">
                                                        {transaction.products.map((product) => (
                                                            <div key={product._id} className="text-sm">
                                                                <span className="font-medium">{product.productId.itemName}</span>
                                                                <span className="text-gray-500 ml-1">× {product.quantity}</span>
                                                                <span className="text-gray-400 ml-1">(₹{product.productId.price} each)</span>
                                                            </div>
                                                        ))}
                                                        <div className="text-xs text-gray-500 mt-1">Total items: {totalItems}</div>
                                                    </div>
                                                )}
                                                {transaction.source === "FINANCIAL" && (
                                                    transaction.type === "deposit" ? (
                                                        <div className="flex flex-col mt-2">
                                                            <span className="font-medium">Deposit Type <span className="text-gray-400 ml-1">- {transaction.depositType}</span></span>
                                                            <span className="font-medium">Relation <span className="text-gray-400 ml-1">- {transaction.relationShipId}</span></span>
                                                        </div>
                                                    ) : transaction.type === "withdrawal" ? (
                                                        <div className="flex flex-col mt-2">
                                                            <span className="font-medium">
                                                                Withdrawal Type <span className="text-gray-400 ml-1">- {transaction.depositType}</span>
                                                            </span>
                                                            <span className="font-medium">
                                                                Relation <span className="text-gray-400 ml-1">- {transaction.relationShipId}</span>
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col mt-2">
                                                            <span className="font-medium">Work Assignment <span className="text-gray-400 ml-1">- {transaction?.workAssignId?.name}</span></span>
                                                            <span className="font-medium">No Of Hours Worked <span className="text-gray-400 ml-1">- {transaction.hoursWorked}</span></span>
                                                        </div>
                                                    )
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {transaction.source === "FINANCIAL" ? (
                                                        <Badge key={transaction._id} variant="secondary" className="text-xs">
                                                            {transaction.type}
                                                        </Badge>
                                                    ) : (
                                                        categories.map((category, index) => (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {category}
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-green-600">
                                                {transaction.totalAmount || transaction.wageAmount || transaction.depositAmount}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">{formatDate(transaction.createdAt)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {transaction.source}
                                                </Badge>
                                            </TableCell>
                                            {/* 🔹 Status Cell */}
                                            <TableCell className={getStatusColor(transaction.status || "Completed")}>
                                                {transaction.isReversed || transaction.status === "reversed" ? (
                                                    <Badge variant="destructive" className="text-xs">
                                                        Transaction reversed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {transaction.status || "Completed"}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                                        No transactions found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {data?.count > 10 && (
                        <TablePagination
                            component="div"
                            count={data?.count}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default TransactionHistory
