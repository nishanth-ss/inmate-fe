import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import useFetchData from "../../hooks/useFetchData";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Plus, Edit, Trash2, Camera, Trash } from "lucide-react";
import { Label } from "../../components/ui/label";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Input } from "../../components/ui/input";
import { usePostData } from "../../hooks/usePostData";
import { useHandleDelete } from "../../hooks/useHandleDelete";
import { Box, Snackbar } from "@mui/material";
import { useSnackbar } from "notistack";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { TablePagination } from "@mui/material"
import FaceRecognition from "@/components/faceidcomponent/FaceId";

function UserManagement() {

    const [selectedUser, setSelectedUser] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [faceidModalOpen, setFaceidModalOpen] = useState(false);
    const [faceIdData, setFaceIdData] = useState(null);

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

    const validationSchema = Yup.object().shape({
        username: Yup.string().required("Username is required"),
        fullname: Yup.string().required("Full name is required"),
        role: Yup.string().required("Role is required"),
        ...(selectedUser
            ? {
                oldPassword: Yup.string()
                    .test('password-test', 'Please enter your current password', function (value) {
                        const newPassword = this.parent.newPassword;
                        return !newPassword || !!value;
                    }),
                newPassword: Yup.string()
                    .nullable()
                    .min(6, "Password must be at least 6 characters"),
                confirmPassword: Yup.string()
                    .test('password-test', 'Passwords must match', function (value) {
                        const newPassword = this.parent.newPassword;
                        return !newPassword || value === newPassword;
                    }),
            }
            : {
                password: Yup.string()
                    .required("Password is required")
                    .min(6, "Password must be at least 6 characters"),
                confirmPassword: Yup.string()
                    .required("Confirm password is required")
                    .oneOf([Yup.ref("password"), null], "Passwords must match"),
            }),
    });


    const [refetch, setRefetch] = useState(0);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [openAlert, setOpenAlert] = useState({ showAlert: false, message: '', bgColor: '' })
    const locationRaw = localStorage.getItem("location");
    const location = locationRaw ? JSON.parse(locationRaw) : null;
    const loggedInUsername = localStorage.getItem("username");

    const { data, error } = useFetchData(`users?page=${page + 1}&limit=${rowsPerPage}`, refetch, "true");

    useEffect(() => {
        setTimeout(() => setOpenAlert({ showAlert: false, message: '', bgColor: '' }), 5000)
    }, [openAlert])

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const { enqueueSnackbar } = useSnackbar();

    const postData = async (payload) => {

        if (!location) {
            enqueueSnackbar("Location is required", {
                variant: 'error',
            });
            return;
        }
        const isEdit = !!selectedUser;
        const url = isEdit ? `users/${selectedUser._id}` : `users/create`;
        const method = isEdit ? "put" : "post";

        // Prepare payload - only include password fields if they're being changed
        const updatePayload = {
            username: payload.username,
            fullname: payload.fullname,
            role: payload.role,
            password: payload.password,
            locationId: location?._id,
            ...(payload.newPassword && {
                oldPassword: payload.oldPassword,
                newPassword: payload.newPassword
            }),
            descriptor: faceIdData ? faceIdData : payload?.descriptor || null
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
            enqueueSnackbar(isEdit ? "User updated successfully" : "User created successfully", {
                variant: 'success',
            });
        }
    };

    async function deleteItem(id) {
        const { data, error } = await useHandleDelete(`users/${id}`);
        if (error) {
            enqueueSnackbar(data?.data?.message, {
                variant: 'error',
            });

        } else {
            enqueueSnackbar(data?.data?.message, {
                variant: 'success',
            });
            setTimeout(() => setRefetch((prev) => prev + 1), 100);
        }
    }

    async function deleteFaceId(id) {
        const { data, error } = await useHandleDelete(`faceRecognition/delete/${id}`);
        if (error) {
            enqueueSnackbar(data?.data?.message, {
                variant: 'error',
            });

        } else {
            enqueueSnackbar(data?.data?.message, {
                variant: 'success',
            });
            setTimeout(() => setRefetch((prev) => prev + 1), 100);
            setSelectedUser({...selectedUser, descriptor: []});
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
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 text-sm">Monitor Users</p>
                    </div>

                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-500" onClick={() => setSelectedUser(null)}>
                                <Plus className="w-4 h-4 mr-2" /> Add New User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-white">
                            <DialogHeader>
                                <DialogTitle>{selectedUser ? "Edit User" : "Add New User"}</DialogTitle>
                            </DialogHeader>
                            <Formik
                                initialValues={{
                                    username: selectedUser?.username || "",
                                    fullname: selectedUser?.fullname || "",
                                    role: typeof selectedUser?.role === 'object' ? selectedUser?.role?._id : selectedUser?.role || "",
                                    oldPassword: "",
                                    newPassword: "",
                                    confirmPassword: "",
                                    password: "",
                                }}
                                enableReinitialize
                                validationSchema={validationSchema}
                                onSubmit={postData}
                            >
                                {({ handleChange, handleBlur, values, errors, touched, setFieldValue }) => (
                                    <Form>
                                        <div className="mb-4">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                name="username"
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.username}
                                                className="mt-1 border border-blue-500"
                                            />
                                            {errors.username && touched.username && (
                                                <p className="text-red-500 text-sm">{errors.username}</p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <Label htmlFor="fullname">Full Name</Label>
                                            <Input
                                                id="fullname"
                                                name="fullname"
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                value={values.fullname}
                                                className="mt-1 border border-blue-500"
                                            />
                                            {errors.fullname && touched.fullname && (
                                                <p className="text-red-500 text-sm">{errors.fullname}</p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <Label htmlFor="role">Role</Label>
                                            <Select onValueChange={(value) => setFieldValue("role", value)} value={values?.role}>
                                                <SelectTrigger className="mt-1 w-full  border border-blue-500">
                                                    <SelectValue placeholder="Select Role" />
                                                </SelectTrigger>
                                                <SelectContent className="mt-1 border border-blue-500">
                                                    <SelectItem value={"ADMIN"}>{"ADMIN"}</SelectItem>
                                                    <SelectItem value={"POS"}>{"POS"}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.role && touched.role && (
                                                <p className="text-red-500 text-sm">{errors.role}</p>
                                            )}
                                        </div>

                                        {selectedUser && (
                                            <>
                                                <div className="mb-4">
                                                    <Label htmlFor="oldPassword">Current Password</Label>
                                                    <Input
                                                        id="oldPassword"
                                                        name="oldPassword"
                                                        type="password"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.oldPassword}
                                                        className="mt-1 border border-blue-500"
                                                        placeholder="Leave blank if not changing password"
                                                    />
                                                    {errors.oldPassword && touched.oldPassword && (
                                                        <p className="text-red-500 text-sm">{errors.oldPassword}</p>
                                                    )}
                                                </div>

                                                <div className="mb-4">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <Input
                                                        id="newPassword"
                                                        name="newPassword"
                                                        type="password"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.newPassword}
                                                        className="mt-1 border border-blue-500"
                                                        placeholder="Leave blank if not changing password"
                                                    />
                                                    {errors.newPassword && touched.newPassword && (
                                                        <p className="text-red-500 text-sm">{errors.newPassword}</p>
                                                    )}
                                                </div>

                                                <div className="mb-4">
                                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        type="password"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.confirmPassword}
                                                        className="mt-1 border border-blue-500"
                                                        placeholder="Leave blank if not changing password"
                                                    />
                                                    {errors.confirmPassword && touched.confirmPassword && (
                                                        <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {!selectedUser && (
                                            <>
                                                <div className="mb-4">
                                                    <Label htmlFor="password">Password</Label>
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type="password"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.password}
                                                        className="mt-1 border border-blue-500"
                                                    />
                                                    {errors.password && touched.password && (
                                                        <p className="text-red-500 text-sm">{errors.password}</p>
                                                    )}
                                                </div>
                                                <div className="mb-4">
                                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                                    <Input
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        type="password"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.confirmPassword}
                                                        className="mt-1 border border-blue-500"
                                                    />
                                                    {errors.confirmPassword && touched.confirmPassword && (
                                                        <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {/* Face ID Button */}
                                       {values?.role !== "INMATE" && <div className="mb-4 grid grid-cols-[90%_10%] gap-2">
                                            <Button type="button" onClick={() => setFaceidModalOpen(true)} className="bg-gray-500 text-white w-full">
                                                <Camera />
                                                {selectedUser?.descriptor?.length > 0 ? "Update Face ID" : "Register Face ID"}
                                            </Button>
                                            <Button type="button" disabled={selectedUser?.descriptor?.length === 0} onClick={() => deleteFaceId(selectedUser?._id)} className="bg-red-500 hover:bg-red-600 text-white w-full">
                                                <Trash />
                                            </Button>
                                        </div>}
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
                                <TableHead className="text-center font-semibold">User Name</TableHead>
                                <TableHead className="text-center font-semibold">Full Name</TableHead>
                                <TableHead className="text-center font-semibold">Role</TableHead>
                                <TableHead className="text-center font-semibold">Created Date</TableHead>
                                <TableHead className="text-center font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.data?.length > 0 ? data?.data?.map((user) => {
                                const totalAdmins = data?.data?.filter(u => u.role === "ADMIN").length;
                                const isLastAdmin = user.role === "ADMIN" && totalAdmins === 1;
                                const isSelf = user.username === loggedInUsername;

                                return (
                                    <TableRow key={user._id} className="hover:bg-gray-50">
                                        <TableCell className="text-center">{user?.username || "-"}</TableCell>
                                        <TableCell className="text-center">{user?.fullname || "-"}</TableCell>
                                        <TableCell className="text-center">{user?.role || "-"}</TableCell>
                                        <TableCell className="text-center">{formatDate(user?.createdAt)}</TableCell>
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
                                                    disabled={user?.role === "INMATE"}
                                                >
                                                    <Edit className="w-4 h-4 text-gray-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        deleteItem(user?._id)
                                                    }}
                                                    disabled={isSelf}
                                                >
                                                    <Trash2 className="w-4 h-4 text-gray-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-4">
                                        No user available
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
                    count={data?.totalItems || 0}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            }

            {/* Face ID Modal */}
            {faceidModalOpen && (
                <FaceRecognition mode="register" open={faceidModalOpen} setOpen={setFaceidModalOpen} faceIdData={faceIdData} setFaceIdData={setFaceIdData} />
            )}
        </div>
    );
}

export default UserManagement;