import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/UI/table";
import { useState } from "react";
import { Button } from "../../components/UI/button";
import { Edit, Plus, Trash2 } from "lucide-react";
import { TablePagination } from "@mui/material";
import StoreInventoryDialog from "./StoreInventoryModal";
import useFetchData from "@/hooks/useFetchData";
import { useHandleDelete } from "@/hooks/useHandleDelete";
import { useSnackbar } from "notistack";


function StoreInventory() {

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [open, setOpen] = useState(false);
    const [selectedData, setSelectedData] = useState();
    const [refetch, setRefetch] = useState(0);
    const { data, error } = useFetchData(`inventory`, refetch);
    const { enqueueSnackbar } = useSnackbar();

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    async function deleteItem(id) {
        const { data, error } = await useHandleDelete(`inventory/store/${id}`);

        if (error) {
            enqueueSnackbar(data?.data?.message, {
                variant: 'error',
            });
        } else {
            enqueueSnackbar(data?.data?.message, {
                variant: 'success',
            });
            setTimeout(() => setRefetch((prev) => prev + 1), 200);
        }
    }

    return (
        <div className="w-full bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-8xl mx-auto space-y-6">
                <div className="flex justify-end">
                    <Button onClick={() => setOpen(true)} className="bg-blue-500"><Plus className="w-4 h-4 mr-2" />Create Inventory</Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="text-center font-semibold">S.NO</TableHead>
                                <TableHead className="text-center font-semibold">Date</TableHead>
                                <TableHead className="text-center font-semibold">Invoice</TableHead>
                                <TableHead className="text-center font-semibold">Vendor</TableHead>
                                <TableHead className="text-center font-semibold">Amount</TableHead>
                                <TableHead className="text-center font-semibold">Stocks</TableHead>
                                <TableHead className="text-center font-semibold">Items</TableHead>
                                <TableHead className="text-center font-semibold">Selling Price</TableHead>
                                <TableHead className="text-center font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.length > 0 ? (
                                data.map((record, recordIndex) => (
                                    <TableRow key={recordIndex} className="hover:bg-gray-50">
                                        <TableCell className="text-center">{recordIndex + 1}</TableCell>
                                        <TableCell className="text-center">
                                            {new Date(record.vendorPurchase.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-center">{record.vendorPurchase.invoiceNo}</TableCell>
                                        <TableCell className="text-center">{record.vendorPurchase.vendorName}</TableCell>
                                        <TableCell className="text-center">
                                            {/* Amount per item stacked */}
                                            {/* {record.items.map((item) => (
            <div key={item._id}>{item.amount}</div>
          ))} */}
                                            {record.totalAmount}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {/* Stocks per item stacked */}
                                            {record.items.map((item) => (
                                                <div key={item._id} className="pb-1">{item.stock}</div>
                                            ))}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {/* Items stacked */}
                                            {record.items.map((item) => (
                                                <div key={item._id}>{item.itemName}</div>
                                            ))}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {/* Selling price stacked */}
                                            {record.items.map((item) => (
                                                <div key={item._id}>{item.sellingPrice}</div>
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedData(record);
                                                        setOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        deleteItem(record?.vendorPurchase?._id)
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center text-gray-500 py-4">
                                        No inventory records found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>


                    </Table>
                </div>
            </div>

            <TablePagination
                component="div"
                count={data?.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
            <StoreInventoryDialog open={open} setOpen={setOpen} selectedData={selectedData} setSelectedData={setSelectedData} setRefetch={setRefetch} refetch={refetch} />
        </div>
    );
}

export default StoreInventory;
