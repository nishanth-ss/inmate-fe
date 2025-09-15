import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Badge } from "../../components/ui/badge"
import { Card, CardContent } from "../../components/ui/card";
import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import InmateForm from "../../Components/InmateForm"
import useFetchData from "../../hooks/useFetchData"
import { useHandleDelete } from "../../hooks/useHandleDelete"
import { Box, Snackbar, TableSortLabel } from "@mui/material"
import { useSnackbar } from "notistack"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TablePagination,
} from "@mui/material";

function InMateManageMent() {
    const { enqueueSnackbar } = useSnackbar();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedInmate, setSelectedInmate] = useState(null);
    const [refetch, setRefetch] = useState(0)
    const [searchItem, setSearchItem] = useState();
    const [openAlert, setOpenAlert] = useState({ showAlert: false, message: '', bgColor: '' })

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [order, setOrder] = useState("desc");
    const [orderBy, setOrderBy] = useState("inmateId");

    const url = React.useMemo(() => {
        if (searchItem) {
            return `inmate/search?query=${searchItem}&page=${page + 1}&limit=${rowsPerPage}`;
        }
        return `inmate?sortField=${orderBy}&sortOrder=${order}&page=${page + 1}&limit=${rowsPerPage}`;
    }, [searchItem, page, rowsPerPage, order, orderBy]);

    const { data, error } = useFetchData(url, refetch, "logs");
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "dsc" : "asc");
        setOrderBy(property);
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

    async function deleteItem(id) {
        const { data, error } = await useHandleDelete(`inmate/${id}`);
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

    const handleAdd = () => {
        setSelectedInmate(null);
        setIsFormOpen(true);
    };

    useEffect(() => {
        setTimeout(() => setOpenAlert({ showAlert: false, message: '', bgColor: '' }), 5000)
    }, [refetch, openAlert])

    return (

        <div className="w-full">

            <Box sx={{ width: 500, bgcolor: 'red' }}>
                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={openAlert?.message}
                    message={openAlert?.message}
                    autoHideDuration={2000}
                    ContentProps={{
                        sx: {
                            backgroundColor: openAlert?.bgColor,
                            color: '#fff',
                        }
                    }}
                    key={'topcenter'}
                />
            </Box>

            <div className="p-6 max-w-8xl mx-auto min-h-screen bg-gray-50">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inmate Management</h1>
                        <p className="text-gray-600">Manage inmate profiles and demographics</p>
                    </div>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleAdd} className="bg-blue-500">
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Inmate
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-[#fff]">
                            <DialogHeader>
                                <DialogTitle>
                                    {selectedInmate ? "Edit Inmate" : "Add New Inmate"}
                                </DialogTitle>
                            </DialogHeader>
                            <InmateForm
                                inmate={selectedInmate}
                                setRefetch={setRefetch}
                                refetch={refetch}
                                setIsFormOpen={setIsFormOpen}
                                selectedInmate={selectedInmate}
                                setSelectedInmate={setSelectedInmate}
                                setOpenAlert={setOpenAlert}
                                openAlert={openAlert}
                                onSuccess={() => {
                                    setIsFormOpen(false);
                                    setSelectedInmate(null)

                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="mb-6  border border-[#3498db]">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                            <div className="flex-1">
                                <div className="relative ">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 " />
                                    <Input
                                        placeholder="Search by name, ID, or cell number"
                                        onChange={(e) => {
                                            setSearchItem(e.target.value)
                                            setPage(0)
                                            setRefetch(refetch + 1)
                                        }}
                                        className="pl-10  border border-[#3498db]"
                                    />
                                </div>
                            </div>
                            <Button variant="outline">
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="bg-white rounded-lg border border-[#3498db]">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "inmateId"}
                                        direction={orderBy === "inmateId" ? order : "asc"}
                                        onClick={() => handleRequestSort("inmateId")}
                                    >
                                        Inmate ID
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "firstName"}
                                        direction={orderBy === "firstName" ? order : "dsc"}
                                        onClick={() => handleRequestSort("firstName")}
                                    >
                                        Name
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "custodyType"}
                                        direction={orderBy === "custodyType" ? order : "dsc"}
                                        onClick={() => handleRequestSort("custodyType")}
                                    >
                                        UC/TC/RP
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "cellNumber"}
                                        direction={orderBy === "cellNumber" ? order : "dsc"}
                                        onClick={() => handleRequestSort("cellNumber")}
                                    >
                                        Cell Number
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "balance"}
                                        direction={orderBy === "balance" ? order : "dsc"}
                                        onClick={() => handleRequestSort("balance")}
                                    >
                                        Balance
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell>
                                    <TableSortLabel
                                        active={orderBy === "status"}
                                        direction={orderBy === "status" ? order : "dsc"}
                                        onClick={() => handleRequestSort("status")}
                                    >
                                        Status
                                    </TableSortLabel>
                                </TableCell>

                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data?.data?.length > 0 ? data?.data?.map((inmate) => (
                                <TableRow key={inmate._id} className="border-b last:border-b-0">
                                    <TableCell className="text-gray-900">{inmate.inmateId}</TableCell>
                                    <TableCell className="text-gray-900">{inmate.firstName + " " + inmate.lastName}</TableCell>
                                    <TableCell className="text-gray-600">{inmate.custodyType}</TableCell>
                                    <TableCell className="text-gray-600">{inmate.cellNumber}</TableCell>
                                    <TableCell sx={{ color: "#4ade80",fontWeight: 600 }}>{inmate.balance}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                            {inmate.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                                                setIsFormOpen(true)
                                                setSelectedInmate(inmate)
                                            }}>
                                                <Edit className="w-4 h-4 text-gray-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                                                onClick={() => {
                                                    deleteItem(inmate?._id)
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4 text-gray-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{
                                        textAlign: "center",
                                        color: "gray",
                                        py: 2
                                    }}>
                                        No inmate available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={data?.totalItems || 0}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </div>
            </div>
        </div >
    )
}
export default InMateManageMent