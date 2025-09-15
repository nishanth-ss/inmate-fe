import { Card, CardContent, CardHeader, CardTitle } from "../../components/UI/card";
import { Users, Plus, Briefcase, ShoppingCart, ArrowRightLeft, ReceiptIndianRupee } from "lucide-react";
import useFetchData from "../../hooks/useFetchData";
import { usePostData } from "../../hooks/usePostData";
import { useState } from "react";

function DashBoard() {
    const [refetchToggle, setRefetchToggle] = useState(0);
    const { data, error } = useFetchData("dashboard"); // refetchToggle triggers refresh

    const handleReverse = async (transaction) => {
        if (!transaction || !transaction._id) {
            alert("Transaction ID missing");
            return;
        }

        if (!confirm("Are you sure you want to reverse this transaction?")) return;

        try {
            const { data: resp, error } = await usePostData(
                `pos-shop-cart/reverse/${transaction._id}`,
                { reason: "by mistake" },
                "post"
            );

            if (error) {
                alert("Failed to reverse transaction: " + (error?.response?.data?.message || error.message));
                return;
            }

            if (!resp || !resp.success) {
                alert("Transaction reversal failed: " + (resp?.message || "Unknown error"));
                return;
            }

            // Update local transaction state immediately
            if (data?.recentTransactions) {
                const updatedTransactions = data.recentTransactions.map(t =>
                    t._id === transaction._id
                        ? { ...t, details: { ...t.details, isReversed: true } }
                        : t
                );
                data.recentTransactions = updatedTransactions;
            }

            setRefetchToggle(prev => prev + 1); // trigger re-render
            alert("Transaction reversed successfully!");
        } catch (err) {
            console.error("Catch block error:", err);
            alert("Failed to reverse transaction. See console for details.");
        }
    };

    return (
        <div className="w-full bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-8xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-600 text-sm md:text-base">
                        Monitor system statistics and recent activities
                    </p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <Card className="relative overflow-hidden border border-[#3498db]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Inmates</p>
                                    <p className="text-3xl font-bold text-gray-900">{data?.totalInmates || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border border-[#3498db]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Total Balance</p>
                                    <p className="text-3xl font-bold text-gray-900">₹{data?.totalBalance || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <ReceiptIndianRupee className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border border-[#3498db]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{"Today's Transactions"}</p>
                                    <p className="text-3xl font-bold text-gray-900">{data?.todayTransactionCount || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <ArrowRightLeft className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border border-[#3498db]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Tuck Shop Sales</p>
                                    <p className="text-3xl font-bold text-gray-900">₹{data?.totalSalesToday || 0}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <ShoppingCart className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {data?.recentTransactions?.length > 0 ? (
                                    data.recentTransactions.map((transaction, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.type === "deposit"
                                                        ? "bg-green-100"
                                                        : transaction.type === "wages"
                                                            ? "bg-blue-100"
                                                            : "bg-red-100"
                                                        }`}
                                                >
                                                    {transaction.type === "deposit" ? (
                                                        <Plus className={`text-sm ${transaction.type === "deposit" ? "text-green-600" : "text-blue-600"}`} />
                                                    ) : transaction?.details?.type === "wages" ? (
                                                        <Briefcase className="text-blue-600 text-sm" />
                                                    ) : (
                                                        <ShoppingCart className="text-red-600 text-sm" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">
                                                        {transaction?.details?.inmateId} -{" "}
                                                        <span className="text-red-400">
                                                            {transaction?.details?.custodyType}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {transaction?.details?.type === "deposit"
                                                            ? "Family Deposit"
                                                            : transaction?.details?.type === "wages"
                                                                ? "Daily Wage"
                                                                : "Tuck Shop Purchase"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span
                                                    className={`text-sm font-medium ${transaction.type === "POS" ? "text-red-600" : "text-green-600"
                                                        }`}
                                                >
                                                    ₹{transaction?.totalAmount}
                                                </span>

                                                {/* Reverse Button */}
                                                {transaction.type === "POS" && !transaction?.details?.isReversed && (
                                                    <button
                                                        onClick={() => handleReverse(transaction)}
                                                        className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                                    >
                                                        Reverse
                                                    </button>
                                                )}
                                                {transaction.type === "POS" && transaction?.details?.isReversed && (
                                                    <span className="ml-2 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded">
                                                        Reversed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No recent transactions</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Balance Alerts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-800">Low Balance Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {data?.lowBalanceInmates?.length > 0 ? (
                                    data.lowBalanceInmates.map((transaction) => (
                                        <div
                                            key={transaction._id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600">
                                                        {transaction?.inmateId}{" "}
                                                        {transaction?.custodyType && (
                                                            <>
                                                                - <span className="text-red-400">{transaction.custodyType}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {transaction?.firstName + " " + transaction?.lastName}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`text-sm font-medium ${parseFloat(transaction.amount) > 0 ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                {transaction?.balance}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No recent transactions</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default DashBoard;
