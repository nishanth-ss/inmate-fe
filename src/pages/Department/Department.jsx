import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/UI/table";
import useFetchData from "../../hooks/useFetchData";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "../../components/UI/dialog";
import { Button } from "../../components/UI/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Label } from "../../components/UI/label";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Input } from "../../components/UI/input";
import { usePostData } from "../../hooks/usePostData";
import { useHandleDelete } from "../../hooks/useHandleDelete";
import { Box, Snackbar } from "@mui/material";
import { useSnackbar } from "notistack";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/UI/select"
import { TablePagination } from "@mui/material"

function Department() {

    const validationSchema = Yup.object().shape({
        name: Yup.string().required("Name is required"),
        isActive: Yup.boolean().required("Full name is required"),
    });

    const [selectedUser, setSelectedUser] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [refetch, setRefetch] = useState(0);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [openAlert, setOpenAlert] = useState({ showAlert: false, message: '', bgColor: '' })
    const { enqueueSnackbar } = useSnackbar();
    const [departments, setDepartments] = useState([])
    const { data } = useFetchData("department", refetch);

    useEffect(() => {
        if (data) {
            setDepartments(data);
        }
    }, [data]);

    useEffect(() => {
        setTimeout(() => setOpenAlert({ showAlert: false, message: '', bgColor: '' }), 5000)
    }, [openAlert]);

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

    const postData = async (payload) => {
        const isEdit = !!selectedUser;
        const url = isEdit ? `department/${selectedUser._id}` : `department/create`;
        const method = isEdit ? "put" : "post";

        const updatePayload = {
            name: payload.name,
            isActive: payload.isActive === "true" ? true : false,
        };

        const { error } = await usePostData(url, updatePayload, method);

        if (error) {
            enqueueSnackbar(error.response?.data.message, {
                variant: 'error',
            });
        } else {
            setRefetch((prev) => prev + 1);
            setIsFormOpen(false);
            setSelectedUser(null);
            enqueueSnackbar(isEdit ? "Department updated successfully" : "Department created successfully", {
                variant: 'success',
            });
        }
    };

    async function deleteItem(id) {
        const { data, error } = await useHandleDelete(`department/${id}`);
        setRefetch(refetch + 1)
        if (error) {
            enqueueSnackbar(data?.data?.message, {
                variant: 'error',
            });

        } else {
            setRefetch(refetch + 1)
            enqueueSnackbar(data?.data?.message, {
                variant: 'success',
            });
        }
    }

    return (
        <div className="w-full bg-gray-50 p-4 md:p-6 lg:p-8">
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

            <div className="max-w-8xl mx-auto space-y-6">
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-gray-900">Department</h1>
                    </div>

                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-500" onClick={() => setSelectedUser(null)}>
                                <Plus className="w-4 h-4 mr-2" /> Create Department
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white">
                            <DialogHeader>
                                <DialogTitle>{selectedUser ? "Edit Department" : "Add New Department"}</DialogTitle>
                            </DialogHeader>
                            <Formik
                                initialValues={{
                                    name: selectedUser?.name || "",
                                    isActive: selectedUser?.isActive === false ? "false" : "true",
                                }}
                                enableReinitialize
                                validationSchema={validationSchema}
                                onSubmit={postData}
                            >
                                {({ handleChange, handleBlur, values, errors, touched, setFieldValue }) => (
                                    <Form>
                                        <div className="mb-4">
                                            <Label htmlFor="name" className="mb-2">Name</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.name}
                                                className="mt-1 border border-blue-500"
                                            />
                                            {errors.name && touched.name && (
                                                <p className="text-red-500 text-sm">{errors.name}</p>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <Label htmlFor="name" className="mb-2">Status</Label>
                                            <Select
                                                value={values.isActive}
                                                onValueChange={(value) => setFieldValue("isActive", value)}
                                                className="mt-1 border border-blue-500 focus-visible:ring-0 focus-visible:outline-none focus-visible:border-blue-500"
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Frequency" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                                    <SelectItem value="true">True</SelectItem>
                                                    <SelectItem value="false">False</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex justify-end space-x-4">
                                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                                                {selectedUser ? "Update" : "Add"}
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-50">
                                <TableHead className="text-center font-semibold">S.NO</TableHead>
                                <TableHead className="text-center font-semibold">Name</TableHead>
                                <TableHead className="text-center font-semibold">Status</TableHead>
                                <TableHead className="text-center font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {departments?.length > 0 ? (
                                departments.map((user, index) => (
                                    <TableRow key={user._id} className="hover:bg-gray-50">
                                        <TableCell className="text-center">{index + 1 || "-"}</TableCell>
                                        <TableCell className="text-center">{user?.name || "-"}</TableCell>
                                        <TableCell className="text-center">
                                            {user?.isActive ? "Active" : "Inactive"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsFormOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        deleteItem(user?._id);
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
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                                        No department found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {
                <TablePagination
                    component="div"
                    count={departments?.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            }
        </div>
    );
}

export default Department;