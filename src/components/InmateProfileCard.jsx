import React from "react";
import { User } from "lucide-react";

const InmateProfileCard = ({ inmate }) => {
    if (!inmate) return <div>No Inmate Data</div>;

    return (
        <div className="w-4xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-4 border">
            <div className="flex flex-col items-center border-b pb-3 shadow-sm rounded-2xl">
                <span>
                    <User className="w-40 h-40" />
                </span>
                <h2 className="text-2xl font-semibold text-gray-800 pb-3 text-center">
                    {inmate.firstName} {inmate.lastName}
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 pt-8">
                <div className="text-xl">
                    <strong>Inmate ID:</strong> {inmate.inmateId}
                </div>
                <div className="text-xl">
                    <strong>Custody Type:</strong>{" "}
                    <span className="text-red-500">{inmate.custodyType}</span>
                </div>
                <div className="text-xl">
                    <strong>Cell Number:</strong> {inmate.cellNumber}
                </div>
                <div className="text-xl">
                    <strong>Balance:</strong> ₹{inmate.balance}
                </div>
                <div className="text-xl">
                    <strong>Date of Birth:</strong>{" "}
                    {new Date(inmate.dateOfBirth).toLocaleDateString()}
                </div>
                <div className="text-xl">
                    <strong>Admission Date:</strong>{" "}
                    {new Date(inmate.admissionDate).toLocaleDateString()}
                </div>
                <div className="text-xl">
                    <strong>Crime Type:</strong> {inmate.crimeType}
                </div>
                <div className="text-xl">
                    <strong>Status:</strong>{" "}
                    <span className="text-blue-600">{inmate.status}</span>
                </div>
                {/* <div className="text-xl">
                    <strong>Created At:</strong>{" "}
                    {new Date(inmate.createdAt).toLocaleString()}
                </div>
                <div className="text-xl">
                    <strong>Updated At:</strong>{" "}
                    {new Date(inmate.updatedAt).toLocaleString()}
                </div> */}
            </div>
        </div>
    );
};

export default InmateProfileCard;
