import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePostData } from "@/hooks/usePostData";
import { useFormik } from "formik";
import { useSnackbar } from "notistack";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import useFetchData from "../hooks/useFetchData";
import FaceRecognition from "@/components/faceidcomponent/FaceId";
import { useState } from "react";
import { Camera, Trash } from "lucide-react";
import { useHandleDelete } from "@/hooks/useHandleDelete";

function InmateForm({ setRefetch, refetch, setIsFormOpen, selectedInmate, setOpenAlert, openAlert, setSelectedInmate }) {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { data: locations } = useFetchData("location");
    const [faceidModalOpen, setFaceidModalOpen] = useState(false);
    const [faceIdData, setFaceIdData] = useState(null);

    const today = new Date();
    const minBirthDate = new Date(
        today.getFullYear() - 19,
        today.getMonth(),
        today.getDate()
    );

    async function postData(payLoad) {
        const isEdit = !!selectedInmate;
        const url = isEdit ? `inmate/${selectedInmate._id}` : `inmate/create`;
        const method = isEdit ? "put" : "post";

        const customPayload = { ...payLoad, locationId: locations?.[0]?._id, descriptor: faceIdData ? faceIdData : payLoad?.descriptor || null }

        const { data, error } = await usePostData(url, customPayload, method);

        if (error) {
            if (error.status === 401 || error.status === 403) {
                enqueueSnackbar(error.message, {
                    variant: 'error',
                });
                localStorage.clear();
                navigate("/login");
            } else {
                enqueueSnackbar(error?.message, {
                    variant: 'error',
                });
            }
        } else {
            setRefetch(refetch + 1);
            setIsFormOpen(false);
            enqueueSnackbar(data?.message, {
                variant: 'success',
            });
        }
    }

    const formik = useFormik({
        initialValues: {
            inmateId: selectedInmate?.inmateId || "",
            status: selectedInmate?.status || "",
            firstName: selectedInmate?.firstName || "",
            lastName: selectedInmate?.lastName || "",
            cellNumber: selectedInmate?.cellNumber || "",
            custodyType: selectedInmate?.custodyType || "",
            dateOfBirth: selectedInmate?.dateOfBirth
                ? new Date(selectedInmate.dateOfBirth).toISOString().split("T")[0]
                : "",
            admissionDate: selectedInmate?.admissionDate
                ? new Date(selectedInmate.admissionDate).toISOString().split("T")[0]
                : "",
            crimeType: selectedInmate?.crimeType || "",
            is_blocked: selectedInmate?.is_blocked === "true" ? true : false,
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            inmateId: Yup.string().required("Inmate ID is required"),
            status: Yup.string().required("Status is required"),
            firstName: Yup.string().required("First Name is required"),
            custodyType: Yup.string().required("Custody Type is required"),
            lastName: Yup.string().required("Last Name is required"),
            cellNumber: Yup.string().required("Cell Number is required"),
            dateOfBirth: Yup.date()
                .required("Date of Birth is required")
                .test(
                    "min-age",
                    "Inmate must be at least 19 years old on the admission date",
                    function (dob) {
                        const { admissionDate } = this.parent;
                        if (!dob || !admissionDate) return true;
                        const admission = new Date(admissionDate);
                        const minDate = new Date(
                            admission.getFullYear() - 19,
                            admission.getMonth(),
                            admission.getDate()
                        );
                        return dob <= minDate;
                    }
                )
                .max(new Date(), "Future dates are not allowed"),
            admissionDate: Yup.date().required("Admission Date is required"),
            crimeType: Yup.string().required("Crime Type is required"),
            is_blocked: Yup.boolean()
        }),
        onSubmit: (values) => {
            postData(values)
        },
    });

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
            setSelectedInmate({ ...selectedInmate, user_id: { ...selectedInmate.user_id, descriptor: [] } });
        }
    }

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="inmateId">Inmate ID</Label>
                    <Input
                        id="inmateId"
                        name="inmateId"
                        placeholder="Enter inmate ID"
                        onChange={formik.handleChange}
                        value={formik.values.inmateId}
                        className="mt-1 border border-blue-500"
                    />
                    {formik.touched.inmateId && formik.errors.inmateId && (
                        <p className="text-sm text-red-600">{formik.errors.inmateId}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={formik.values.status}
                        onValueChange={(value) => formik.setFieldValue("status", value)}
                    >
                        <SelectTrigger className="mt-1 border border-blue-500 w-full">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="On Bail">On Bail</SelectItem>
                            <SelectItem value="On Parole">On Parole</SelectItem>
                            <SelectItem value="Released">Released</SelectItem>
                            <SelectItem value="Transfer">Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                    {formik.touched.status && formik.errors.status && (
                        <p className="text-sm text-red-600">{formik.errors.status}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Enter first name"
                        onChange={formik.handleChange}
                        value={formik.values.firstName}
                        className="mt-1 border border-blue-500"
                    />
                    {formik.touched.firstName && formik.errors.firstName && (
                        <p className="text-sm text-red-600">{formik.errors.firstName}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Enter last name"
                        onChange={formik.handleChange}
                        value={formik.values.lastName}
                        className="mt-1 border border-blue-500"
                    />
                    {formik.touched.lastName && formik.errors.lastName && (
                        <p className="text-sm text-red-600">{formik.errors.lastName}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="custodyType">Custody Type</Label>
                    <Select
                        value={formik.values.custodyType}
                        onValueChange={(value) => formik.setFieldValue("custodyType", value)}
                    >
                        <SelectTrigger className="mt-1 border border-blue-500 w-full">
                            <SelectValue placeholder="Select custody type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="Under Trail">Under Trail </SelectItem>
                            <SelectItem value="Contempt of Court">Contempt of Court</SelectItem>
                            <SelectItem value="Remand Prison">Remand Prison</SelectItem>
                        </SelectContent>
                    </Select>
                    {formik.touched.custodyType && formik.errors.custodyType && (
                        <p className="text-sm text-red-600">{formik.errors.custodyType}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="cellNumber">Cell Number</Label>
                    <Input
                        id="cellNumber"
                        name="cellNumber"
                        placeholder="Enter cell number"
                        onChange={formik.handleChange}
                        value={formik.values.cellNumber}
                        className="mt-1 border border-blue-500"
                    />
                    {formik.touched.cellNumber && formik.errors.cellNumber && (
                        <p className="text-sm text-red-600">{formik.errors.cellNumber}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        onChange={formik.handleChange}
                        value={formik.values.dateOfBirth}
                        max={new Date().toISOString().split("T")[0]}
                        className="mt-1 border border-blue-500"
                    />
                    {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
                        <p className="text-sm text-red-600">{formik.errors.dateOfBirth}</p>
                    )}
                </div>
                <div>
                    <Label htmlFor="admissionDate">Admission Date</Label>
                    <Input
                        id="admissionDate"
                        name="admissionDate"
                        type="date"
                        onChange={formik.handleChange}
                        value={formik.values.admissionDate}
                        className="mt-1 border border-blue-500"
                    />
                    {formik.touched.admissionDate && formik.errors.admissionDate && (
                        <p className="text-sm text-red-600">
                            {formik.errors.admissionDate}
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="crimeType">Crime Type</Label>
                    <Input
                        id="crimeType"
                        name="crimeType"
                        placeholder="Enter crime type"
                        onChange={formik.handleChange}
                        value={formik.values.crimeType}
                        className="mt-1 border border-blue-500"
                    />
                    {formik.touched.crimeType && formik.errors.crimeType && (
                        <p className="text-sm text-red-600">{formik.errors.crimeType}</p>
                    )}
                </div>

                {/* Face ID Button */}
                <div className="grid grid-cols-[80%_20%] gap-2">
                    <Button type="button" onClick={() => setFaceidModalOpen(true)} className="bg-gray-500 text-white w-full">
                        <Camera />
                        {selectedInmate?.user_id?.descriptor?.length > 0 ? "Update Face ID" : "Register Face ID"}
                    </Button>
                    <Button type="button" disabled={!selectedInmate?.user_id?.descriptor || selectedInmate?.user_id?.descriptor?.length === 0} onClick={() => deleteFaceId(selectedInmate?.user_id?._id)} className="bg-red-500 hover:bg-red-600 text-white w-full">
                        <Trash />
                    </Button>
                </div>

                {/* Block checkbox */}
                <div className="flex items-center space-x-2 mt-2">
                    <input
                        id="is_blocked"
                        name="is_blocked"
                        type="checkbox"
                        checked={Boolean(formik.values.is_blocked)}
                        onChange={(e) => formik.setFieldValue("is_blocked", e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <Label htmlFor="is_blocked">
                        Block
                    </Label>
                </div>
            </div>
            <div className="flex justify-end space-x-4">
                <Button type="submit" className={`bg-blue-500 text-white ${faceidModalOpen ? "hidden" : ""}`}>
                    {selectedInmate ? "Update Inmate" : "Create Inmate"}
                </Button>
            </div>

            {faceidModalOpen && (
                <FaceRecognition mode="register" open={faceidModalOpen} setOpen={setFaceidModalOpen} faceIdData={faceIdData} setFaceIdData={setFaceIdData} />
            )}
        </form>
    );
}

export default InmateForm;
