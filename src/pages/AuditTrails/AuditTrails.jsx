import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/UI/table"
import { useState } from "react"
import useFetchData from "../../hooks/useFetchData"
import { TablePagination } from "@mui/material"

function AuditTrails() {

    const [refetch, setRefetch] = useState(0)

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const { data, error } = useFetchData(`logs?page=${page + 1}&limit=${rowsPerPage}`, refetch, "logs");

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

    return (
        <div className="min-h-screen w-full bg-gray-50 p-4 md:p-6 lg:p-8 ">

            <div className="max-w-8xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-2xl font-bold text-gray-900">Audit Trails</h1>
                    <p className="text-gray-600 text-sm md:text-base">Monitor system statistics and recent activities</p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="font-semibold w-1/6">User Name</TableHead>
                                <TableHead className="font-semibold w-1/6">Target Model</TableHead>
                                <TableHead className="font-semibold w-1/6">Description</TableHead>
                                <TableHead className="font-semibold w-1/6">Actions</TableHead>
                                <TableHead className="font-semibold w-1/6">Inmate ID</TableHead>
                                <TableHead className="font-semibold w-1/6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.data?.length > 0 ? (
                                data.data.map((inmate) => (
                                    <TableRow key={inmate._id} className="hover:bg-gray-50">
                                        <TableCell>{inmate?.username || '-'}</TableCell>
                                        <TableCell>{inmate?.targetModel || '-'}</TableCell>
                                        <TableCell>{inmate?.description || '-'}</TableCell>
                                        <TableCell>{inmate?.action || '-'}</TableCell>
                                        <TableCell className="font-medium">
                                            {inmate?.changes?.inmateId || '-'}{" "}
                                            {inmate?.changes?.custodyType && (
                                                <>
                                                    - <span className="text-red-400">{inmate.changes.custodyType}</span>
                                                </>
                                            )}
                                        </TableCell>
                                        <TableCell>{inmate?.changes?.status || '-'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                                        No data available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        component="div"
                        count={data?.pagination?.total || 0}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </div>
            </div>
        </div>
    )
}
export default AuditTrails