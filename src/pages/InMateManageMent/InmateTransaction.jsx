import useFetchData from "../../hooks/useFetchData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Box, Snackbar, TablePagination } from "@mui/material"
import { useState } from "react";
import { usePostData } from "../../hooks/usePostData";
import { Badge } from "../../components/ui/badge";

function InmateTransaction() {

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [refetch, setRefetch] = useState(0);

    const handleReverse = async (transaction) => {
        if(!transaction || !transaction._id) { alert('Transaction id missing'); return; }
        if(!confirm('Are you sure you want to reverse this transaction?')) return;
        try {
            const { data: resp, error } = await usePostData(`/cart/${transaction._id}/reverse`, { reason: 'by mistake' }, 'post');
            if (error || !resp) { console.error(error); alert('Failed to reverse transaction'); return; }
            setRefetch(prev => prev + 1);
            alert('Transaction reversed successfully');
        } catch (err) { console.error(err); alert('Failed to reverse'); }
    };


    const handleChangePage = (
        event,
        newPage,
    ) => {
        setPage(newPage);
        setRefetch(refetch + 1)
    };

    const handleChangeRowsPerPage = (
        event,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setRefetch(refetch + 1)
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Active":
                return "text-green-600"
            case "Inactive":
                return "text-gray-600"
            case "Transfer":
                return "text-blue-600"
            case "Released":
                return "text-purple-600"
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

    const userName = localStorage.getItem('username');
    const { data, error } = useFetchData(`inmate/inmate-transaction/${userName}?page=${page + 1}&limit=${rowsPerPage}`, refetch, "true");

    return (
        <div className="border rounded-lg overflow-hidden m-10 w-full">
            <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold">Inmate ID</TableHead>
                                <TableHead className="font-semibold">Transaction</TableHead>
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
                                                            Withdrawl Type <span className="text-gray-400 ml-1">- {transaction.depositType}</span>
                                                        </span>
                                                        <span className="font-medium">
                                                            Relation <span className="text-gray-400 ml-1">- {transaction.relationShipId}</span>
                                                        </span>
                                                        </div>
                                                    ): (
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
                                            <TableCell className={getStatusColor("Completed")}>Completed</TableCell>
                                        
                                            <TableCell className="text-right">
                                                {transaction.type === 'POS' && !transaction.details?.isReversed ? (
                                                    <button onClick={() => handleReverse(transaction)} className="text-sm px-3 py-1 bg-red-100 text-red-600 rounded-md border border-red-200">Reverse</button>
                                                ) : transaction.type === 'POS' && transaction.details?.isReversed ? (
                                                    <span className="text-xs text-gray-400 italic">Reversed</span>
                                                ) : null}
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
                    {
                        data?.count > 10 &&
                        <TablePagination
                            component="div"
                            count={data?.count}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    }
        </div>
    );
}

export default InmateTransaction;