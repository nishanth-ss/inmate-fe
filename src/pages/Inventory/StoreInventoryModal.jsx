import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    IconButton,
    MenuItem,
    Autocomplete,
} from "@mui/material";
import { FieldArray, Formik, Form } from "formik";
import * as Yup from "yup";
import { Add, Delete } from "@mui/icons-material";
import { usePostData } from "@/hooks/usePostData";
import { useSnackbar } from "notistack";
import { useHandleDelete } from "@/hooks/useHandleDelete";
import useFetchData from "@/hooks/useFetchData";

function StoreInventoryDialog({ open, setOpen, selectedData, setSelectedData, setRefetch, refetch }) {

    const { enqueueSnackbar } = useSnackbar();
    
    const { data } = useFetchData('inventory/canteen-item-options',refetch);

    const initialValues = {
        date: selectedData?.vendorPurchase?.date
            ? selectedData.vendorPurchase.date.split("T")[0] // keep only YYYY-MM-DD
            : "",
        invoiceNo: selectedData?.vendorPurchase?.invoiceNo || "",
        vendorName: selectedData?.vendorPurchase?.vendorName || "",
        status: selectedData?.vendorPurchase?.status || "Active",
        storeItems: selectedData?.items?.map((item) => ({
            itemName: item.itemName || "",
            itemNo: item.itemNo || "",
            amount: item.amount || "",
            stock: item.stock || "",
            sellingPrice: item.sellingPrice || "",
            category: item.category || "",
            status: item.status || "Active",
            itemID: item._id || ""
        })) || [
                {
                    itemName: "",
                    itemNo: "",
                    amount: "",
                    stock: "",
                    sellingPrice: "",
                    category: "",
                    status: "Active",
                },
            ],
    };


    const validationSchema = Yup.object({
        date: Yup.string().required("Date is required"),
        invoiceNo: Yup.string().required("Invoice No is required"),
        vendorName: Yup.string().required("Vendor Name is required"),
        storeItems: Yup.array().of(
            Yup.object().shape({
                itemName: Yup.string().required("Item name is required"),
                itemNo: Yup.string().when("itemName", {
                    is: (val) => data?.some((opt) => opt.itemName === val), // required only if it's an existing item
                    then: (schema) => schema.required("Item No is required"),
                    otherwise: (schema) => schema.optional(),
                }),
                category: Yup.string().when("itemName", {
                    is: (val) => data?.some((opt) => opt.itemName === val),
                    then: (schema) => schema.required("Category is required"),
                    otherwise: (schema) => schema.optional(),
                }),
                amount: Yup.number().required("Amount is required").positive(),
                stock: Yup.number().required("Stock required").positive(),
                sellingPrice: Yup.number().required("Selling Price required").positive(),
            })
        ),
    });

    useEffect(() => {
        return () => {
            setSelectedData(null)
        }
    }, [])

    async function postData(payLoad) {
        console.log(payLoad);

        const isEdit = !!selectedData;
        const url = isEdit ? `inventory/${selectedData?.vendorPurchase?._id}` : `inventory`;
        const method = isEdit ? "put" : "post";

        const { data, error } = await usePostData(url, payLoad, method);

        if (error) {
            enqueueSnackbar(error?.message || "Something went wrong", {
                variant: "error",
            });
        } else {
            setRefetch(refetch + 1);

            enqueueSnackbar(
                data?.data?.message || (isEdit ? "Updated successfully" : "Created successfully"),
                { variant: "success" }
            );
        }
        setSelectedData(null)
    }

    async function handleItemDelete(id, remove) {
        const { data, error } = await useHandleDelete(`inventory/item/${id}`);
        if (error) {
            enqueueSnackbar(data?.data?.message, {
                variant: 'error',
            });
        } else {
            enqueueSnackbar(data?.data?.message, {
                variant: 'success',
            });
            setTimeout(() => setRefetch((prev) => prev + 1), 200);
            remove()
        }
    }

    return (
        <Dialog open={open} onClose={() => { setOpen(false), setSelectedData(null) }} fullWidth maxWidth="md">
            <DialogTitle>
                {selectedData ? "Edit Store Inventory" : "Add Store Inventory"}
            </DialogTitle>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={async (values, { setSubmitting }) => {
                    console.log("Submitting...", values);
                    await postData(values);
                    setSubmitting(false);
                    setOpen(false);
                }}
            >
                {({ values, handleChange, errors, touched, setFieldValue }) => (
                    <Form>
                        <DialogContent dividers>
                            <div className="flex flex-col gap-4">
                                <TextField
                                    name="date"
                                    type="date"
                                    label="Date"
                                    InputLabelProps={{ shrink: true }}
                                    value={values.date}
                                    onChange={handleChange}
                                    error={touched.date && Boolean(errors.date)}
                                    helperText={touched.date && errors.date}
                                    fullWidth
                                />

                                <TextField
                                    name="invoiceNo"
                                    label="Invoice No"
                                    value={values.invoiceNo}
                                    onChange={handleChange}
                                    error={touched.invoiceNo && Boolean(errors.invoiceNo)}
                                    helperText={touched.invoiceNo && errors.invoiceNo}
                                    fullWidth
                                />

                                <TextField
                                    name="vendorName"
                                    label="Vendor Name"
                                    value={values.vendorName}
                                    onChange={handleChange}
                                    error={touched.vendorName && Boolean(errors.vendorName)}
                                    helperText={touched.vendorName && errors.vendorName}
                                    fullWidth
                                />

                                {/* Store Items Section */}
                                <FieldArray name="storeItems">
                                    {({ push, remove }) => (
                                        <div className="flex flex-col gap-4">
                                            <h3 className="font-semibold">Store Items</h3>

                                            {values.storeItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-col gap-4 border p-4 rounded-lg"
                                                >
                                                    {/* First row: 3 columns */}
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {/* Item Name Autocomplete */}
                                                        <Autocomplete
                                                            freeSolo
                                                            options={data.map((opt) => opt.itemName)}
                                                            value={item.itemName || ""}
                                                            onChange={(e, newValue) => {
                                                                const selected = data.find(
                                                                    (opt) => opt.itemName === newValue
                                                                );

                                                                if (selected) {
                                                                    // Existing item selected
                                                                    setFieldValue(
                                                                        `storeItems[${index}].itemName`,
                                                                        selected.itemName || ""
                                                                    );
                                                                    setFieldValue(
                                                                        `storeItems[${index}].itemNo`,
                                                                        selected.itemNo || ""
                                                                    );
                                                                    setFieldValue(
                                                                        `storeItems[${index}].stock`,
                                                                        selected.stockQuantity || 1
                                                                    );
                                                                    setFieldValue(
                                                                        `storeItems[${index}].sellingPrice`,
                                                                        selected.price || 0
                                                                    );
                                                                    setFieldValue(
                                                                        `storeItems[${index}].category`,
                                                                        selected.category || ""
                                                                    );
                                                                    setFieldValue(
                                                                        `storeItems[${index}].status`,
                                                                        selected.status || "Active"
                                                                    );
                                                                } else {
                                                                    // New item typed
                                                                    setFieldValue(
                                                                        `storeItems[${index}].itemName`,
                                                                        newValue || ""
                                                                    );
                                                                }
                                                            }}
                                                            onInputChange={(e, newInputValue) => {
                                                                setFieldValue(
                                                                    `storeItems[${index}].itemName`,
                                                                    newInputValue || ""
                                                                );
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="Pick or Type Item Name"
                                                                    size="small"
                                                                    error={
                                                                        touched.storeItems?.[index]?.itemName &&
                                                                        Boolean(errors.storeItems?.[index]?.itemName)
                                                                    }
                                                                    helperText={
                                                                        touched.storeItems?.[index]?.itemName &&
                                                                        errors.storeItems?.[index]?.itemName
                                                                    }
                                                                />
                                                            )}
                                                        />

                                                        <TextField
                                                            name={`storeItems[${index}].itemNo`}
                                                            label="Item No"
                                                            size="small"
                                                            value={item.itemNo}
                                                            onChange={handleChange}
                                                            error={
                                                                touched.storeItems?.[index]?.itemNo &&
                                                                Boolean(errors.storeItems?.[index]?.itemNo)
                                                            }
                                                            helperText={
                                                                touched.storeItems?.[index]?.itemNo &&
                                                                errors.storeItems?.[index]?.itemNo
                                                            }
                                                        />

                                                        <TextField
                                                            name={`storeItems[${index}].amount`}
                                                            label="Amount"
                                                            type="number"
                                                            size="small"
                                                            value={item.amount}
                                                            onChange={handleChange}
                                                            error={
                                                                touched.storeItems?.[index]?.amount &&
                                                                Boolean(errors.storeItems?.[index]?.amount)
                                                            }
                                                            helperText={
                                                                touched.storeItems?.[index]?.amount &&
                                                                errors.storeItems?.[index]?.amount
                                                            }
                                                            onWheel={(e) => e.target.blur()}
                                                        />
                                                    </div>

                                                    {/* Second row: 4 columns */}
                                                    <div className="grid grid-cols-4 gap-4 items-center">
                                                        <TextField
                                                            name={`storeItems[${index}].stock`}
                                                            label="Stock"
                                                            type="number"
                                                            size="small"
                                                            value={item.stock}
                                                            onChange={handleChange}
                                                            error={
                                                                touched.storeItems?.[index]?.stock &&
                                                                Boolean(errors.storeItems?.[index]?.stock)
                                                            }
                                                            helperText={
                                                                touched.storeItems?.[index]?.stock &&
                                                                errors.storeItems?.[index]?.stock
                                                            }
                                                            onWheel={(e) => e.target.blur()}
                                                        />

                                                        <TextField
                                                            name={`storeItems[${index}].sellingPrice`}
                                                            label="Selling Price"
                                                            type="number"
                                                            size="small"
                                                            value={item.sellingPrice}
                                                            onChange={handleChange}
                                                            error={
                                                                touched.storeItems?.[index]?.sellingPrice &&
                                                                Boolean(errors.storeItems?.[index]?.sellingPrice)
                                                            }
                                                            helperText={
                                                                touched.storeItems?.[index]?.sellingPrice &&
                                                                errors.storeItems?.[index]?.sellingPrice
                                                            }
                                                            onWheel={(e) => e.target.blur()}
                                                        />

                                                        <TextField
                                                            name={`storeItems[${index}].category`}
                                                            label="Category"
                                                            size="small"
                                                            value={item.category}
                                                            onChange={handleChange}
                                                            error={
                                                                touched.storeItems?.[index]?.category &&
                                                                Boolean(errors.storeItems?.[index]?.category)
                                                            }
                                                            helperText={
                                                                touched.storeItems?.[index]?.category &&
                                                                errors.storeItems?.[index]?.category
                                                            }
                                                        />

                                                        <div className="flex justify-end">
                                                            <IconButton
                                                                size="small"
                                                                sx={{ width: 50, height: 32 }} // fixed width = 50px
                                                                onClick={() =>
                                                                    !selectedData?.items
                                                                        ? remove(index)
                                                                        : handleItemDelete(
                                                                            values?.storeItems?.[index]?.itemID,
                                                                            index,
                                                                            remove(index)
                                                                        )
                                                                }
                                                                disabled={values.storeItems.length === 1}
                                                            >
                                                                <Delete fontSize="small" color="error" />
                                                            </IconButton>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Add fontSize="small" />}
                                                onClick={() =>
                                                    push({
                                                        itemName: "",
                                                        itemNo: "",
                                                        amount: "",
                                                        stock: "",
                                                        sellingPrice: "",
                                                        category: "",
                                                        status: "Active",
                                                    })
                                                }
                                            >
                                                Add Item
                                            </Button>
                                        </div>
                                    )}
                                </FieldArray>

                            </div>
                        </DialogContent>

                        <DialogActions>
                            <Button onClick={() => { setOpen(false), setSelectedData(null) }} color="secondary" variant="outlined">
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" color="primary">
                                {selectedData ? "Update" : "Create"}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}

export default StoreInventoryDialog;
