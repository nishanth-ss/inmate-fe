import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Plus, CreditCard } from "lucide-react"
import { Formik, Form, Field } from "formik"
import * as Yup from "yup"
import { usePostData } from "../../hooks/usePostData"
import { useEffect, useState } from "react"
import { Box, Snackbar } from "@mui/material"
import { useSnackbar } from "notistack"
import useFetchData from "../../hooks/useFetchData"


function FinancialManagement() {

    const { enqueueSnackbar } = useSnackbar();
    const [openAlert, setOpenAlert] = useState({ showAlert: false, message: '', bgColor: '' })
    const [inmateIdSearch, setInmateIdSearch] = useState("");
    const [dailyWagesInmateIdSearch, setDailyWagesInmateIdSearch] = useState("");
    const [refetch, setRefetch] = useState(0)
    const [showDeposit, setShowDeposit] = useState(false)
    const [showWage, setShowWage] = useState(false)
    const [selectedInmate, setSelectedInmate] = useState({});
    const [dailyWagesInmate, setDailyWagesInmate] = useState({});
    const { data } = useFetchData("department");
    const locationRaw = localStorage.getItem("location");
    const location = locationRaw ? JSON.parse(locationRaw) : null;


    const { data: inmateData, error: inmateError } = useFetchData(
        inmateIdSearch ? `inmate/search?query=${inmateIdSearch}` : null,
        refetch
    );

    const { data: dailyWagesInmateData, error: dailyWagesInmateError } = useFetchData(
        dailyWagesInmateIdSearch ? `inmate/search?query=${dailyWagesInmateIdSearch}` : null,
        refetch
    );

    useEffect(() => {
        setSelectedInmate(inmateData)
    }, [inmateData])

    useEffect(() => {
        setDailyWagesInmate(dailyWagesInmateData)
    }, [dailyWagesInmateData])

    async function postWagesData(updatedData, urll) {
        const url = urll
        const method = "post";

        const { data, error } = await usePostData(url, updatedData, method);

        if (error) {
            enqueueSnackbar(error?.message, {
                variant: 'error',
            });
        } else {
            enqueueSnackbar(data?.message, {
                variant: 'success',
            });
        }
    }

    return (
        <div className="w-full bg-gray-50 p-6">
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

            <div className="max-w-8xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Management</h1>
                    <p className="text-gray-600">Process wages, deposits, and balance adjustments</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Wage Entry */}
                    <Card className="bg-white shadow-sm">

                        <CardHeader className="flex items-center justify-between ">
                            <CardTitle className="text-xl font-semibold text-gray-900">
                                Daily Wage Entry
                            </CardTitle>
                            {
                                (selectedInmate?.length == 1 && showWage) &&
                                <div className="text-sm font-medium text-green-700 text-right">
                                    <p>Inmate ID: {selectedInmate ? selectedInmate[0]?.inmateId : ''}</p>
                                    <p>Balance: ₹{selectedInmate ? selectedInmate[0]?.balance : ''}</p>
                                    <p className="text-red-400"> Custody Type: {selectedInmate ? selectedInmate[0]?.custodyType : ''}</p>
                                </div>
                            }
                        </CardHeader>

                        <Formik
                            initialValues={{
                                inmateId: "",
                                workAssignId: "",
                                hoursWorked: "",
                                wageAmount: "",
                                transaction: "",
                            }}
                            validationSchema={Yup.object({
                                inmateId: Yup.string().required("Inmate ID is required"),
                                workAssignId: Yup.string().required("Work assignment is required"),
                                hoursWorked: Yup.number().required("Hours worked is required").positive().integer(),
                                wageAmount: Yup.number().required("Wage amount is required").positive(),
                                transaction: Yup.string().required("Transaction is required"),
                            })}
                            onSubmit={(values, { resetForm }) => {

                                let updatedData = {
                                    "status": "ACTIVE",
                                    "type": "wages", ...values, location_id: location._id
                                }
                                postWagesData(updatedData, "financial/create")
                                resetForm();
                                setSelectedInmate([])
                                setShowWage(false)
                            }}
                        >
                            {({ values, handleChange, setFieldValue, handleSubmit, errors, touched }) => (
                                <Form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-5">
                                        {/* Inmate ID */}
                                        <div>
                                            <Label htmlFor="inmateId" className="text-sm font-medium text-gray-700">
                                                Inmate ID
                                            </Label>
                                            <Input
                                                id="inmateId"
                                                name="inmateId"
                                                placeholder="Enter inmate ID"
                                                value={values.inmateId}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setInmateIdSearch(e.target.value);
                                                    setShowWage(true)
                                                    setRefetch(refetch + 1)
                                                }}
                                                className="mt-1"
                                            />
                                            {errors.inmateId && touched.inmateId && (
                                                <p className="text-sm text-red-600 mt-1">{errors.inmateId}</p>
                                            )}
                                        </div>

                                        {/* Work Assignment */}
                                        <div>
                                            <Label htmlFor="workAssignId" className="text-sm font-medium text-gray-700">
                                                Work Assignment
                                            </Label>
                                            <Select
                                                onValueChange={(value) => setFieldValue("workAssignId", value)}
                                                value={values.workAssignId}
                                            >
                                                <SelectTrigger className="mt-1 w-full">
                                                    <SelectValue placeholder="Select work assignment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {
                                                        data?.map((item) => (
                                                            <SelectItem key={item._id} value={item._id}>
                                                                {item.name}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                            {errors.workAssignId && touched.workAssignId && (
                                                <p className="text-sm text-red-600 mt-1">{errors.workAssignId}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="transaction" className="text-sm font-medium text-gray-700">
                                                Transaction
                                            </Label>
                                            <Select
                                                onValueChange={(value) => setFieldValue("transaction", value)}
                                                value={values.transaction}
                                            >
                                                <SelectTrigger className="mt-1 w-full">
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                                    <SelectItem value="DAILY">Daily</SelectItem>
                                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.transaction && touched.transaction && (
                                                <p className="text-sm text-red-600 mt-1">{errors.transaction}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="hoursWorked" className="text-sm font-medium text-gray-700">
                                                Hours/Units Worked
                                            </Label>
                                            <Input
                                                id="hoursWorked"
                                                name="hoursWorked"
                                                type="number"
                                                placeholder="Enter Hours/Units Worked"
                                                value={values.hoursWorked}
                                                onChange={handleChange}
                                                className="mt-1"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            {errors.hoursWorked && touched.hoursWorked && (
                                                <p className="text-sm text-red-600 mt-1">{errors.hoursWorked}</p>
                                            )}
                                        </div>

                                        {/* Wage Amount */}
                                        <div>
                                            <Label htmlFor="wageAmount" className="text-sm font-medium text-gray-700">
                                                Wage Amount
                                            </Label>
                                            <Input
                                                id="wageAmount"
                                                name="wageAmount"
                                                type="number"
                                                step="Enter Amount"
                                                placeholder="8.50"
                                                value={values.wageAmount}
                                                onChange={handleChange}
                                                className="mt-1"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            {errors.wageAmount && touched.wageAmount && (
                                                <p className="text-sm text-red-600 mt-1">{errors.wageAmount}</p>
                                            )}
                                        </div>

                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Wage Entry
                                        </Button>
                                    </CardContent>
                                </Form>
                            )}
                        </Formik>
                    </Card>


                    {/* Family Deposit Processing */}
                    <Card className="bg-white shadow-sm relative">
                        <CardHeader className="flex items-center justify-between w-full">
                            <CardTitle className="text-xl font-semibold text-gray-900">
                                Deposit Processing
                            </CardTitle>

                            {
                                (dailyWagesInmateData?.length == 1 && showDeposit) &&
                                <div className="text-sm font-medium text-green-700 text-right">
                                    <p>Inmate ID: {dailyWagesInmateData ? dailyWagesInmateData[0]?.inmateId : ''}</p>
                                    <p>Balance: ₹{dailyWagesInmateData ? dailyWagesInmateData[0]?.balance : ''}</p>
                                    <p className="text-red-400">Custody Type: {dailyWagesInmateData ? dailyWagesInmateData[0]?.custodyType : ''}</p>
                                </div>
                            }
                        </CardHeader>

                        <Formik
                            initialValues={{
                                inmateId: "",
                                depositType: "",
                                relationShipId: "",
                                depositAmount: "",
                            }}
                            validationSchema={Yup.object({
                                inmateId: Yup.string().required("Inmate ID is required"),
                                depositType: Yup.string().required("Deposit Type is required"),
                                relationShipId: Yup.string().required("Relationship is required"),
                                depositAmount: Yup.number().required("Deposit amount is required").positive(),
                            })}
                            onSubmit={(values, { resetForm }) => {
                                let updateData = {
                                    "type": "deposit", "status": "ACTIVE", ...values
                                }
                                postWagesData(updateData, "financial/create")
                                resetForm();
                                setDailyWagesInmate([])
                                setShowDeposit(false);
                            }}
                        >
                            {({ values, handleChange, handleSubmit, errors, touched, setFieldValue }) => (
                                <Form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-5">
                                        {/* Inmate ID */}
                                        <div>
                                            <Label htmlFor="inmateId" className="text-sm font-medium text-gray-700">
                                                Inmate ID
                                            </Label>
                                            <Input
                                                id="inmateId"
                                                name="inmateId"
                                                placeholder="Enter inmate ID"
                                                value={values.inmateId}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setDailyWagesInmateIdSearch(e.target.value);
                                                    setShowDeposit(true)
                                                    setRefetch(refetch + 1)
                                                }}
                                                className="mt-1"
                                            />
                                            {errors.inmateId && touched.inmateId && (
                                                <p className="text-sm text-red-600 mt-1">{errors.inmateId}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="depositType" className="text-sm font-medium text-gray-700">
                                                Deposit Type
                                            </Label>
                                            <Select
                                                onValueChange={(value) => setFieldValue("depositType", value)}
                                                value={values.depositType}
                                            >
                                                <SelectTrigger className="mt-1 w-full">
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Admission">Admission</SelectItem>
                                                    <SelectItem value="Mulakath">Mulakath</SelectItem>
                                                    <SelectItem value="Court/Custody">Court/Custody</SelectItem>
                                                    <SelectItem value="Money Order">Money Order</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.depositType && touched.depositType && (
                                                <p className="text-sm text-red-600 mt-1">{errors.depositType}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="relationShipId" className="text-sm font-medium text-gray-700">
                                                Relationship
                                            </Label>
                                            <Select
                                                onValueChange={(value) => setFieldValue("relationShipId", value)}
                                                value={values.relationShipId}
                                            >
                                                <SelectTrigger className="mt-1 w-full">
                                                    <SelectValue placeholder="Select Relationship" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="self">Self</SelectItem>
                                                    <SelectItem value="spouse">Spouse</SelectItem>
                                                    <SelectItem value="parent">Parent</SelectItem>
                                                    <SelectItem value="child">Child</SelectItem>
                                                    <SelectItem value="sibling">Sibling</SelectItem>
                                                    <SelectItem value="friend">Friend</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.relationShipId && touched.relationShipId && (
                                                <p className="text-sm text-red-600 mt-1">{errors.relationShipId}</p>
                                            )}
                                        </div>

                                        {/* Deposit Amount */}
                                        <div>
                                            <Label htmlFor="depositAmount" className="text-sm font-medium text-gray-700">
                                                Deposit Amount
                                            </Label>
                                            <Input
                                                id="depositAmount"
                                                name="depositAmount"
                                                type="number"
                                                step="0.01"
                                                value={values.depositAmount}
                                                onChange={handleChange}
                                                className="mt-1"
                                                placeholder="Enter Deposit Amount"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            {errors.depositAmount && touched.depositAmount && (
                                                <p className="text-sm text-red-600 mt-1">{errors.depositAmount}</p>
                                            )}
                                        </div>

                                        <Button type="submit" className="w-[93%] bg-green-600 hover:bg-green-700 text-white mt-4 absolute bottom-6">
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Process Deposit
                                        </Button>
                                    </CardContent>
                                </Form>
                            )}
                        </Formik>
                    </Card>
                    {/* Withdrawal Processing */}
                    <Card className="bg-white shadow-sm">
                        <CardHeader className="flex items-center justify-between w-full">
                            <CardTitle className="text-xl font-semibold text-gray-900">
                                Withdrawal Entry
                            </CardTitle>

                            {
                                (dailyWagesInmateData?.length == 1 && showDeposit) &&
                                <div className="text-sm font-medium text-green-700 text-right">
                                    <p>Inmate ID: {dailyWagesInmateData ? dailyWagesInmateData[0]?.inmateId : ''}</p>
                                    <p>Balance: ₹{dailyWagesInmateData ? dailyWagesInmateData[0]?.balance : ''}</p>
                                    <p className="text-red-400">Custody Type: {dailyWagesInmateData ? dailyWagesInmateData[0]?.custodyType : ''}</p>
                                </div>
                            }
                        </CardHeader>

                        <Formik
                            initialValues={{
                                inmateId: "",
                                depositType: "",
                                relationShipId: "",
                                depositAmount: "",
                            }}
                            validationSchema={Yup.object({
                                inmateId: Yup.string().required("Inmate ID is required"),
                                depositType: Yup.string().required("Withdrawal Type is required"),
                                relationShipId: Yup.string().required("Relationship is required"),
                                depositAmount: Yup.number().required("Deposit amount is required").positive(),
                            })}
                            onSubmit={(values, { resetForm }) => {
                                let updateData = {
                                    "type": "withdrawal", "status": "ACTIVE", ...values
                                }

                                postWagesData(updateData, "financial/create")
                                resetForm();
                                setDailyWagesInmate([])
                                setShowDeposit(false);
                            }}
                        >
                            {({ values, handleChange, handleSubmit, errors, touched, setFieldValue }) => (
                                <Form onSubmit={handleSubmit}>
                                    <CardContent className="space-y-5">
                                        {/* Inmate ID */}
                                        <div>
                                            <Label htmlFor="inmateId" className="text-sm font-medium text-gray-700">
                                                Inmate ID
                                            </Label>
                                            <Input
                                                id="inmateId"
                                                name="inmateId"
                                                placeholder="Enter inmate ID"
                                                value={values.inmateId}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setDailyWagesInmateIdSearch(e.target.value);
                                                    setShowDeposit(true)
                                                    setRefetch(refetch + 1)
                                                }}
                                                className="mt-1"
                                            />
                                            {errors.inmateId && touched.inmateId && (
                                                <p className="text-sm text-red-600 mt-1">{errors.inmateId}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="depositType" className="text-sm font-medium text-gray-700">
                                                Withdrawl Type
                                            </Label>
                                            <Select
                                                onValueChange={(value) => setFieldValue("depositType", value)}
                                                value={values.depositType}
                                            >
                                                <SelectTrigger className="mt-1 w-full">
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Mulakath">Mulakath</SelectItem>
                                                    <SelectItem value="Canteen Expenditure">Canteen Expenditure</SelectItem>
                                                    <SelectItem value="Money Order">Money Order</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.depositType && touched.depositType && (
                                                <p className="text-sm text-red-600 mt-1">{errors.depositType}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="relationShipId" className="text-sm font-medium text-gray-700">
                                                Relationship
                                            </Label>
                                            <Select
                                                onValueChange={(value) => setFieldValue("relationShipId", value)}
                                                value={values.relationShipId}
                                            >
                                                <SelectTrigger className="mt-1 w-full">
                                                    <SelectValue placeholder="Select Relationship" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="self">Self</SelectItem>
                                                    <SelectItem value="spouse">Spouse</SelectItem>
                                                    <SelectItem value="parent">Parent</SelectItem>
                                                    <SelectItem value="child">Child</SelectItem>
                                                    <SelectItem value="sibling">Sibling</SelectItem>
                                                    <SelectItem value="friend">Friend</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.relationShipId && touched.relationShipId && (
                                                <p className="text-sm text-red-600 mt-1">{errors.relationShipId}</p>
                                            )}
                                        </div>

                                        {/* Deposit Amount */}
                                        <div>
                                            <Label htmlFor="depositAmount" className="text-sm font-medium text-gray-700">
                                                Withdrawal Amount
                                            </Label>
                                            <Input
                                                id="depositAmount"
                                                name="depositAmount"
                                                type="number"
                                                step="0.01"
                                                value={values.depositAmount}
                                                onChange={handleChange}
                                                className="mt-1"
                                                placeholder="Enter Deposit Amount"
                                                onWheel={(e) => e.target.blur()}
                                            />
                                            {errors.depositAmount && touched.depositAmount && (
                                                <p className="text-sm text-red-600 mt-1">{errors.depositAmount}</p>
                                            )}
                                        </div>

                                        <Button type="submit" className="w-full bg-red-800 hover:bg-red-900 text-white mt-4" disabled={(dailyWagesInmateData && dailyWagesInmateData[0]?.balance === 0) ||
                                            (values.depositAmount > (dailyWagesInmateData && dailyWagesInmateData[0]?.balance))}>
                                            <CreditCard className="w-4 h-4 mr-2" />
                                            Process Withdrawal
                                        </Button>
                                    </CardContent>
                                </Form>
                            )}
                        </Formik>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default FinancialManagement