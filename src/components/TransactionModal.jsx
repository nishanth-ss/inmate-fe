import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Divider
} from "@mui/material";

export default function TransactionDialog({ open, onClose, txn }) {
    if (!txn) return null;

    const getImageUrl = (path) => {
        console.log(`${import.meta.env.VITE_API_URL}${path}`);
        
        return `${import.meta.env.VITE_API_URL}${path}`;
    };


    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogContent dividers>

                {/* <Typography variant="body1">
          <strong>ID:</strong> {txn._id}
        </Typography> */}


                {/* If you want to show user/file info */}
                {txn.inmateId && (
                    <Typography variant="body2">
                        <strong>Inmate ID:</strong> {txn.inmateId}
                    </Typography>
                )}
                <Divider sx={{ my: 2 }} />

                <Typography variant="body1">
                    <strong>Custody Type:</strong> {txn.custodyType}
                </Typography>

                <Typography variant="body1">
                    <strong>Deposit Type:</strong> {txn.depositType}
                </Typography>

                <Typography variant="body1">
                    <strong>Amount:</strong> ₹{txn.depositAmount || txn.amount}
                </Typography>

                <Typography variant="body1">
                    <strong>Source:</strong> {txn.source}
                </Typography>

                <Typography variant="body1">
                    <strong>Type:</strong> {txn.type}
                </Typography>

                <Typography variant="body1">
                    <strong>Remarks:</strong> {txn.remarks || "N/A"}
                </Typography>

                <Typography variant="body1">
                    <strong>Date:</strong>{" "}
                    {new Date(txn.createdAt).toLocaleString()}
                </Typography>

                {txn.fileIds && txn.fileIds.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <Typography variant="subtitle1" gutterBottom>Attached Image:</Typography>
                        {txn.fileIds?.length > 0 && (
                            <div style={{ marginTop: 20 }}>

                                {txn.fileIds.map((file, i) => (
                                    <img
                                        key={file._id}
                                        src={getImageUrl(file.fileUrl)}
                                        alt="attachment"
                                        style={{
                                            width: "100%",
                                            maxHeight: 250,
                                            borderRadius: 8,
                                            objectFit: "contain",
                                            cursor: "pointer",
                                            border: "1px solid #ccc",
                                            marginBottom: 10                                        }}
                                        onClick={() => window.open(getImageUrl(file.fileUrl), "_blank")}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
}
