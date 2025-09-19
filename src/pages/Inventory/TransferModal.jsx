import React, { useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
} from "@mui/material";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { usePostData } from "@/hooks/usePostData";
import { useSnackbar } from "notistack";

function TransferModal({ open, setOpen, selectedItem, setSelectedItem, refetch, setRefetch }) {
    const { enqueueSnackbar } = useSnackbar();

    const initialValues = {
        itemNo: selectedItem?.itemNo || "",
        transferQty: "",
    };

    const validationSchema = Yup.object({
        itemNo: Yup.string().required("Item No is required"),
        transferQty: Yup.number()
            .required("Transfer quantity is required")
            .positive("Must be greater than 0"),
    });

    useEffect(() => {
        return () => {
            setSelectedItem(null);
        };
    }, []);

    async function postData(payLoad) {
        const url = "inventory/transfer";
        const method = "post";

        const { data, error } = await usePostData(url, payLoad, method);

        if (error) {
            enqueueSnackbar(error?.message || "Something went wrong", {
                variant: "error",
            });
        } else {
            setRefetch(refetch + 1);

            enqueueSnackbar(data?.message || "Transferred successfully", {
                variant: "success",
            });
        }
        setSelectedItem(null);
        setOpen(false);
    }

    return (
        <Dialog
            open={open}
            onClose={() => {
                setOpen(false);
                setSelectedItem(null);
            }}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>Transfer Item</DialogTitle>

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
                            {/* Item No (readonly or editable) */}
                            <TextField
                                name="itemNo"
                                label="Item No"
                                size="small"
                                value={values.itemNo}
                                onChange={handleChange}
                                error={touched.itemNo && Boolean(errors.itemNo)}
                                helperText={touched.itemNo && errors.itemNo}
                                fullWidth
                                InputProps={{ readOnly: true }} // keep it readonly since it's coming from selectedItem
                            />

                            {/* Transfer Quantity */}
                            <TextField
                                name="transferQty"
                                label="Transfer Quantity"
                                type="number"
                                size="small"
                                value={values.transferQty}
                                onChange={handleChange}
                                error={touched.transferQty && Boolean(errors.transferQty)}
                                helperText={touched.transferQty && errors.transferQty}
                                fullWidth
                                onWheel={(e) => e.target.blur()} // prevent wheel scroll
                            />
                        </DialogContent>

                        <DialogActions>
                            <Button
                                onClick={() => {
                                    setOpen(false);
                                    setSelectedItem(null);
                                }}
                                color="secondary"
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant="contained" color="primary">
                                Transfer
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}

export default TransferModal;
