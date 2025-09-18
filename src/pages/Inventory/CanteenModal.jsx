import React, { useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { usePostData } from "@/hooks/usePostData";
import { useSnackbar } from "notistack";

function CanteenModal({ open, setOpen, selectedItem, setSelectedItem, refetch, setRefetch }) {
    const { enqueueSnackbar } = useSnackbar();

    const initialValues = {
        itemName: selectedItem?.itemName || "",
        price: selectedItem?.price || "",
        stockQuantity: selectedItem?.stockQuantity || "",
        category: selectedItem?.category || "",
        itemNo: selectedItem?.itemNo || "",
        status: selectedItem?.status || "Active",
    };

    const validationSchema = Yup.object({
        itemName: Yup.string().required("Item name is required"),
        price: Yup.number().required("Price is required").positive(),
        stockQuantity: Yup.number().required("Total stock is required").min(0),
        category: Yup.string().required("Category is required"),
        itemNo: Yup.string().required("Item No is required"),
        status: Yup.string().oneOf(["Active", "Inactive"]).required("Status is required"),
    });

    useEffect(() => {
        return () => {
            setSelectedItem(null)
        }
    }, []);

    async function postData(payLoad) {
        const isEdit = !!selectedItem;
        const url = isEdit ? `inventory/transfer` : `inventory`;
        const method = "post";
        const customPayload = isEdit ? {...payLoad,transferQty: payLoad.stockQuantity} : payLoad

        const { data, error } = await usePostData(url, customPayload, method);

        if (error) {
            enqueueSnackbar(error?.message || "Something went wrong", {
                variant: "error",
            });
        } else {
            setRefetch(refetch + 1);

            enqueueSnackbar(
                data?.message || (isEdit ? "Updated successfully" : "Created successfully"),
                { variant: "success" }
            );
        }
        setSelectedItem(null)
        setOpen(false)
    }

    return (
        <Dialog open={open} onClose={() => { setOpen(false), setSelectedItem(null) }} fullWidth maxWidth="sm">
            <DialogTitle>{selectedItem ? "Edit Item" : "Add Item"}</DialogTitle>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                enableReinitialize
                onSubmit={async (values, { setSubmitting }) => {
                    await postData(values);
                    setSubmitting(false);
                    setOpen(false);
                }}
            >
                {({ values, handleChange, touched, errors }) => (
                    <Form>
                        <DialogContent dividers className="flex flex-col gap-4">
                            <TextField
                                name="itemName"
                                label="Item Name"
                                size="small"
                                value={values.itemName}
                                onChange={handleChange}
                                error={touched.itemName && Boolean(errors.itemName)}
                                helperText={touched.itemName && errors.itemName}
                                fullWidth
                            />

                            <TextField
                                name="price"
                                label="Price"
                                type="number"
                                size="small"
                                value={values.price}
                                onChange={handleChange}
                                error={touched.price && Boolean(errors.price)}
                                helperText={touched.price && errors.price}
                                fullWidth
                                onWheel={(e) => e.target.blur()} // prevent wheel scroll
                            />

                            <TextField
                                name="category"
                                label="Category"
                                size="small"
                                value={values.category}
                                onChange={handleChange}
                                error={touched.category && Boolean(errors.category)}
                                helperText={touched.category && errors.category}
                                fullWidth
                            />

                            <TextField
                                name="itemNo"
                                label="Item No"
                                size="small"
                                value={values.itemNo}
                                onChange={handleChange}
                                error={touched.itemNo && Boolean(errors.itemNo)}
                                helperText={touched.itemNo && errors.itemNo}
                                fullWidth
                            />

                            <TextField
                                name="stockQuantity"
                                label="Stock Quantity"
                                type="number"
                                value={values.stockQuantity}
                                onChange={handleChange}
                                error={touched.stockQuantity && Boolean(errors.stockQuantity)}
                                helperText={touched.stockQuantity && errors.stockQuantity}
                                fullWidth
                                onWheel={(e) => e.target.blur()}
                            />

                            <TextField
                                select
                                name="status"
                                label="Status"
                                size="small"
                                value={values.status}
                                onChange={handleChange}
                                error={touched.status && Boolean(errors.status)}
                                helperText={touched.status && errors.status}
                                fullWidth
                            >
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                            </TextField>
                        </DialogContent>

                        <DialogActions>
                            <Button onClick={() => { setOpen(false), setSelectedItem(null) }} color="secondary" variant="outlined">
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" color="primary">
                                {selectedItem ? "Update" : "Create"}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}

export default CanteenModal;
