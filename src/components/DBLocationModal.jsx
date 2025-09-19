import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    MenuItem,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useFormik } from "formik";
import * as Yup from "yup";
import { usePostData } from "@/hooks/usePostData";
import { enqueueSnackbar } from "notistack";

// ✅ Validation schema
const validationSchema = Yup.object({
    path: Yup.string().required("Path is required"),
    cronTime: Yup.string().required("Cron time is required"),
    time: Yup.date().required("Time is required").nullable(),
    enabled: Yup.boolean(),
});

function DBLocationModal({ open, onClose }) {

    const formik = useFormik({
        initialValues: {
            path: "",
            cronTime: "1 hour",
            time: new Date(),
            enabled: true,
        },
        validationSchema,
        onSubmit: async (values) => {
            // Escape path (C:\x → C:\\x)
            const escapedPath = values.path.replace(/\\/g, "\\");
            const payload = {
                path: escapedPath,
                cronTime: values.cronTime,
                time: values.time
                    ? values.time.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                    })
                    : null,
                enabled: values.enabled,
            };
            const url = `backup`;
            const { data, error } = await usePostData(url,payload);            

            if (!error && data?.success) {
                enqueueSnackbar("Backup location fetched successfully", { variant: "success" });
                onClose();
                formik.resetForm();
            } else {
                enqueueSnackbar("Failed to fetch backup location", { variant: "error" });
            }
        },
    });

    const handleBackup = (values)=>{
        
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={formik.handleSubmit}>
                <DialogTitle>Configure DB Location</DialogTitle>
                <DialogContent className="flex flex-col gap-4">
                    {/* Path Input */}
                    <TextField
                        label="Backup Path"
                        fullWidth
                        name="path"
                        sx={{ marginTop: "1rem" }}
                        value={formik.values.path}
                        onChange={formik.handleChange}
                        error={formik.touched.path && Boolean(formik.errors.path)}
                        helperText={formik.touched.path && formik.errors.path}
                        placeholder="C:\\Users\\nishanth\\backup"
                    />

                    {/* Cron Time Selector */}
                    <TextField
                        select
                        label="Cron Time"
                        fullWidth
                        name="cronTime"
                        value={formik.values.cronTime}
                        onChange={formik.handleChange}
                        error={formik.touched.cronTime && Boolean(formik.errors.cronTime)}
                        helperText={formik.touched.cronTime && formik.errors.cronTime}
                    >
                        <MenuItem value="1 hour">1 Hour</MenuItem>
                        <MenuItem value="2 hours">2 Hours</MenuItem>
                        <MenuItem value="6 hours">6 Hours</MenuItem>
                        <MenuItem value="12 hours">12 Hours</MenuItem>
                        <MenuItem value="24 hours">24 Hours</MenuItem>
                    </TextField>

                    {/* Time Picker */}
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <TimePicker
                            label="Select Time"
                            value={formik.values.time}
                            onChange={(newValue) => formik.setFieldValue("time", newValue)}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    error: formik.touched.time && Boolean(formik.errors.time),
                                    helperText: formik.touched.time && formik.errors.time,
                                },
                            }}
                        />
                    </LocalizationProvider>

                    {/* Enabled Checkbox */}
                    <FormControlLabel
                        control={
                            <Checkbox
                                name="enabled"
                                checked={formik.values.enabled}
                                onChange={formik.handleChange}
                            />
                        }
                        label="Enabled"
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={()=>{onClose();formik.resetForm()}} variant="outlined" color="secondary">
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                        Save
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

export default DBLocationModal;
