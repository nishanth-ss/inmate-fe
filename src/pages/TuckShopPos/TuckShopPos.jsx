// File: src/pages/tuckshop/TuckShopPos.jsx
import { useEffect, useRef, useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Search, Plus, CreditCard, Edit, Camera } from "lucide-react"
import useFetchData from "../../hooks/useFetchData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Formik } from 'formik';
import * as Yup from 'yup';
import { usePostData } from "../../hooks/usePostData"
import { Autocomplete, Box, Snackbar, TextField } from "@mui/material"
import { useSnackbar } from "notistack"
import axios from "axios"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/utilis/useDebounce"
import FaceRecognition from "@/components/faceidcomponent/FaceId"

/**
 * TuckShopPos.jsx
 *
 * Full POS UI for tuck shop:
 * - shows search for inmate transactions (client-side filtering)
 * - allows processing purchases and reversing transactions
 * - inventory management modal (Formik + Yup)
 *
 * NOTE: Replace your existing file with this one. It contains
 * all necessary logic we discussed: reverse, search by inmate id,
 * face recognition integration trigger, and inventory add/edit.
 */

function TuckShopPos() {

    // ---------------- state ----------------
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [refetch, setRefectch] = useState(0);
    const [searchTerm, setSearchTerm] = useState("")
    const [purchaseSearch, setPurchaseSearch] = useState("")   // search input for purchases by inmateId
    const [openAlert, setOpenAlert] = useState({ showAlert: false, message: '', bgColor: '' })
    const [selectedInmateItem, setSelectedInmateItem] = useState(null)
    const [availableItems, setAvailableItem] = useState([]);
    const [filteredPurchases, setFilteredPurchases] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const selectedInmateIdRef = useRef(null);
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    const [selectediInventory, setSelectedInventory] = useState(null);
    const [openFaceId, setOpenFaceId] = useState(false);
    const [faceidData, setFaceIdData] = useState(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // ---------------- useFetchData (match your original endpoints) ----------------
    const { data: tuckShopItems, error: tuckShopError } = useFetchData("tuck-shop", refetch);
    const { data: inmateList, error: inmateError } = useFetchData("inmate", refetch, null, true);
    // ---------- IMPORTANT: fetch purchases from pos-shop-cart (backend route) ----------
    const { data: purchases, error: purchasesError } = useFetchData("pos-shop-cart", refetch);

    // keep the existing search for items (unchanged)
    const { data: searchItem } = useFetchData(
        debouncedSearchTerm ? `tuck-shop/search?query=${debouncedSearchTerm}` : null,
        refetch
    );

    // ---------------- debug logs ----------------
    // useEffect(() => {
    //     console.log("tuckShopItems:", tuckShopItems);
    //     console.log("tuckShopError:", tuckShopError);
    //     console.log("inmateList:", inmateList);
    //     console.log("inmateError:", inmateError);
    //     console.log("purchases:", purchases);
    //     console.log("purchasesError:", purchasesError);
    // }, [tuckShopItems, tuckShopError, inmateList, inmateError, purchases, purchasesError]);

    // ---------------- available items filter ----------------
    useEffect(() => {
        const filteredData = (tuckShopItems || []).filter(item => item?.status !== "inactive")
        setAvailableItem(filteredData || [])
    }, [tuckShopItems]);

    // ---------------- faceid effect ----------------
    useEffect(() => {
        if (faceidData) {
            const fetchData = async () => {
                try {
                    const { data, error } = await usePostData(`inmate/fetch-by-face`, { descriptor: faceidData });
                    if (data) {
                        selectedInmateIdRef.current = data?.data?.data?._id;
                        setSelectedInmateItem(data?.data?.data);
                        handleInmateBalance(data?.data?.data?._id)
                    }
                    if (error) {
                        console.error("Error fetching inmate by face:", error);
                    }
                } catch (err) {
                    console.error("Face ID fetch error:", err);
                }
            };
            fetchData();
        }
    }, [faceidData]); // eslint-disable-line

    const userRole = localStorage.getItem("role");
    const { enqueueSnackbar } = useSnackbar();

    // ---------------- existing postData for creating/updating tuck-shop item ----------------
    async function postData(payLoad) {
        const url = selectediInventory ? `tuck-shop/${selectediInventory._id}` : `tuck-shop/create`;
        const method = selectediInventory ? "put" : "post";

        const { data, error } = await usePostData(url, payLoad, method);

        if (error) {
            enqueueSnackbar(error?.response?.data?.message || error?.message || "Error", { variant: 'error' });
        } else {
            setRefectch(refetch + 1);
            enqueueSnackbar(data?.data?.message || "Success", { variant: 'success' });
            setIsFormOpen(false);
            setSelectedInventory(null);
        }
    }

    // ---------------- validation schema ----------------
    const ItemSchema = Yup.object().shape({
        itemName: Yup.string().required('Item name is Required'),
        description: Yup.string().required('Description is Required'),
        price: Yup.number().required('Item Price Required'),
        stockQuantity: Yup.number().required('Stock Quantity Required'),
        category: Yup.string().required('Category is Required'),
        itemNo: Yup.string().required('Item No is Required'),
        status: Yup.string()
            .oneOf(["active", "inactive"])
            .default("active"),
    });

    // ---------------- cart helper functions ----------------
    const removeDuplicatesAndCount = (items) => {
        const map = new Map();
        items.forEach((item) => {
            if (map.has(item._id)) {
                map.get(item._id).count += 1;
            } else {
                map.set(item._id, { ...item, count: 1 });
            }
        });
        return Array.from(map.values());
    };

    const uniqueCartItems = removeDuplicatesAndCount(cartItems);

    const productsPayload = uniqueCartItems.map(item => ({
        productId: item._id,
        quantity: item.count
    }));

    useEffect(() => {
        if (!openAlert?.showAlert) return;
        const t = setTimeout(() => setOpenAlert({ showAlert: false, message: '', bgColor: '' }), 5000);
        return () => clearTimeout(t);
    }, [openAlert])

    const removeOneItemById = (targetId) => {
        const indexToRemove = cartItems.findIndex(item => item._id === targetId);
        if (indexToRemove !== -1) {
            const newCart = [...cartItems];
            newCart.splice(indexToRemove, 1);
            setCartItems(newCart);
        }
    };

    const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

    // ---------------- post cart data ----------------
    async function postCartData(payload) {
        const url = `pos-shop-cart/create`;
        const method = "post";

        const { data, error } = await usePostData(url, payload, method);

        if (error) {
            enqueueSnackbar(error?.response?.data?.message || error?.message || "Error creating cart", { variant: 'error' });
        } else {
            setRefectch(refetch + 1);
            enqueueSnackbar(data?.data?.message || "Purchase processed", { variant: 'success' });
            setCartItems([])
            setIsFormOpen(false);
            // refresh selected inmate balance
            handleInmateBalance(payload?.inmateId || selectedInmateItem?._id)
        }
    }

    const handleInmateBalance = async (id) => {
        try {
            const targetId = id ? id : selectedInmateItem?._id;
            if (!targetId) return;
            const response = await axios.get(`${import.meta.env.VITE_API_URL}inmate/${targetId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedInmateItem(response?.data?.data);
        } catch (err) {
            console.error("Error fetching inmate balance", err);
        }
    }

    // ---------------- purchase search effect ----------------
    useEffect(() => {
        // If user cleared search box, clear filtered purchases
        // if (!purchaseSearch || purchaseSearch.trim() === "") {
        //     setFilteredPurchases([]);
        //     return;
        // }
        // If purchases already loaded, filter client-side
        if (purchases && Array.isArray(purchases)) {
            setFilteredPurchases(
                purchases.filter((p) =>
                    String(p.inmateId || "").toLowerCase().includes(purchaseSearch.toLowerCase())
                )
            );
        } else {
            setFilteredPurchases([]);
        }
    }, [purchases, purchaseSearch]);

    // ---------------- handle reverse transaction ----------------
    const handleReverse = async (cartId) => {
        if (!cartId) return;
        try {
            const url = `${import.meta.env.VITE_API_URL}pos-shop-cart/reverse/${cartId}`;
            const res = await axios.post(url, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (selectedInmateItem?._id) handleInmateBalance(selectedInmateItem?._id)
            enqueueSnackbar(res?.data?.message || "Transaction reversed", { variant: "success" });
            setRefectch(prev => prev + 1);
        } catch (err) {
            console.error("Reverse error:", err);
            enqueueSnackbar(err?.response?.data?.message || "Error reversing cart", { variant: "error" });
        }
    }

    // ---------------- face recognition component open ----------------
    // FaceRecognition triggers setFaceIdData which then fetches inmate data above

    return (
        <div className="w-full bg-gray-50 p-6">

            {/* Snackbar */}
            <Box sx={{ width: 500 }}>
                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={!!openAlert?.message}
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
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Canteen POS System</h1>
                    <p className="text-gray-600">Process inmate purchases and manage inventory</p>
                </div>

                {/* Recent Purchases */}
                <Card className="border border-[#3498db] max-h-[300px] overflow-y-scroll">
                    <CardHeader className="flex justify-between items-center">
                        <CardTitle>Recent Purchases</CardTitle>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search by Inmate ID..."
                                value={purchaseSearch}
                                onChange={(e) => setPurchaseSearch(e.target.value)}
                                className="w-64"
                            />
                            <Button variant="outline" onClick={() => setRefectch(prev => prev + 1)}>
                                <Search className="w-4 h-4 mr-2" /> Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* show errors clearly so you can debug */}
                        {purchasesError && filteredPurchases?.length === 0  ? (
                            <div className="text-red-500">
                                Error loading purchases: {purchasesError?.message || (purchasesError?.response?.data?.message)}
                            </div>
                        ) : filteredPurchases?.length > 0 ? filteredPurchases.map((p) => (
                            <div key={p._id} className="flex justify-between items-center border-b py-2">
                                <div>
                                    <p className="font-semibold">Inmate: {p.inmateId}</p>
                                    <p className="text-sm text-gray-500">
                                        {p.products?.map(prod =>
                                            `${prod.productId?.itemName} x${prod.quantity}`
                                        ).join(", ")}
                                    </p>
                                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`font-bold ${p.totalAmount < 0 ? "text-red-500" : "text-green-500"}`}>
                                        ₹{p.totalAmount}
                                    </span>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleReverse(p._id)}
                                        disabled={p.is_reversed || userRole !== "ADMIN" }
                                    >
                                        Reverse
                                    </Button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-center py-4">No purchases found for the searched inmate</p>
                        )}
                    </CardContent>
                </Card>

                {/* POS & Inventory Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left side: POS Terminal + Cart */}
                    <Card className="h-fit border border-[#3498db]">
                        <CardHeader className="flex justify-between">
                            <CardTitle className="text-xl font-semibold">Point of Sale Terminal</CardTitle>
                            <Button onClick={() => setOpenFaceId(true)} className="bg-gray-500 text-white">
                                <Camera className="mr-2 h-4 w-4" /> Verify Face ID
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Select Inmate */}
                            <Autocomplete
                                options={inmateList || []}
                                value={selectedInmateItem || null}
                                getOptionLabel={(option) =>
                                    option
                                        ? `${option.firstName} ${option.lastName} - ${option.inmateId}${option.is_blocked === "true" ? " (Blocked)" : ""}`
                                        : ""
                                }
                                onChange={(event, newValue) => {
                                    setSelectedInmateItem(newValue);
                                    selectedInmateIdRef.current = newValue?.inmateId || null;
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" label="Select inmate" fullWidth />
                                )}
                            />

                            {/* Balance */}
                            <div className="flex justify-between">
                                {selectedInmateItem?.custodyType && (
                                    <p className="text-red-400">Custody: {selectedInmateItem?.custodyType}</p>
                                )}
                                {selectedInmateItem && (
                                    <p className="text-green-500">Balance: ₹{selectedInmateItem?.balance}</p>
                                )}
                            </div>

                            {/* Cart */}
                            <div>
                                <h3 className="text-lg font-medium mb-3">Cart</h3>
                                <div className="border rounded-lg p-4 min-h-[120px] bg-gray-50 border-[#3498db]">
                                    {uniqueCartItems.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">Cart is empty</p>
                                    ) : uniqueCartItems.map((item) => (
                                        <div key={item._id} className="flex justify-between items-center bg-white p-2 rounded mb-2">
                                            <div>
                                                <span className="font-medium">{item?.itemName}</span>
                                                <span className="text-gray-500 ml-2">x{item?.count}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" onClick={() => removeOneItemById(item?._id)}>-</Button>
                                                <span className="font-medium">₹{(item.price * item?.count).toFixed(2)}</span>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={item?.count >= item?.stockQuantity}
                                                    onClick={() => setCartItems([...cartItems, item])}
                                                >+</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Available Items */}
                            <div>
                                <h3 className="text-lg font-medium mb-3">Available Items</h3>
                                <div className="space-y-2 max-h-[230px] overflow-y-scroll">
                                    {availableItems?.map((item) => (
                                        <div
                                            key={item._id}
                                            className="flex justify-between items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 border border-[#3498db]"
                                            onClick={() => setCartItems([...cartItems, item])}
                                        >
                                            <div>
                                                <div className="font-medium">{item.itemName}</div>
                                                <div className="text-sm text-gray-500">Stock: {item.stockQuantity}</div>
                                            </div>
                                            <div className="font-medium">₹{item.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xl font-semibold">Total:</span>
                                    <span className="text-xl font-bold text-green-600">₹{total.toFixed(2)}</span>
                                </div>

                                {selectedInmateItem?.balance >= total && total > 0 && (
                                    <Button
                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
                                        onClick={() => {
                                            const values = {
                                                inmateId: selectedInmateItem?.inmateId,
                                                totalAmount: total,
                                                products: productsPayload
                                            }
                                            postCartData(values)
                                        }}
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Process Purchase
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Section */}
                    <Card className="h-fit border border-[#3498db]">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Inventory</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Search and Add */}
                            <div className="flex gap-2 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search items..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border border-[#3498db]"
                                    />
                                </div>

                                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                    {/* <DialogTrigger asChild>
                                        <Button className="bg-blue-500 hover:bg-blue-600" disabled={userRole !== "ADMIN"}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Item
                                        </Button>
                                    </DialogTrigger> */}
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{selectediInventory ? "Update Item" : "Add New Item"}</DialogTitle>
                                        </DialogHeader>

                                        <Formik
                                            initialValues={{
                                                itemName: selectediInventory?.itemName || '',
                                                description: selectediInventory?.description || '',
                                                price: selectediInventory?.price || '',
                                                stockQuantity: selectediInventory?.stockQuantity || '',
                                                category: selectediInventory?.category || '',
                                                itemNo: selectediInventory?.itemNo || '',
                                                status: selectediInventory?.status || "active"
                                            }}
                                            enableReinitialize
                                            validationSchema={ItemSchema}
                                            onSubmit={(values) => {
                                                postData(values)
                                            }}
                                        >

                                            {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
                                                <form onSubmit={handleSubmit} className="space-y-4">

                                                    {/* Item Name */}
                                                    <div>
                                                        <Label htmlFor="itemName">Item Name</Label>
                                                        <Input
                                                            id="itemName"
                                                            name="itemName"
                                                            onChange={handleChange}
                                                            value={values.itemName}
                                                            className="mt-1 border border-blue-500"
                                                        />
                                                        {errors.itemName && touched.itemName && (
                                                            <p className="text-red-500 text-sm">{errors.itemName}</p>
                                                        )}
                                                    </div>

                                                    {/* Description */}
                                                    <div>
                                                        <Label htmlFor="description">Description</Label>
                                                        <Input
                                                            id="description"
                                                            name="description"
                                                            onChange={handleChange}
                                                            value={values.description}
                                                            className="mt-1 border border-blue-500"
                                                        />
                                                        {errors.description && touched.description && (
                                                            <p className="text-red-500 text-sm">{errors.description}</p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="price">Price (₹)</Label>
                                                            <Input
                                                                id="price"
                                                                name="price"
                                                                type="number"
                                                                onChange={handleChange}
                                                                value={values.price}
                                                                className="mt-1 border border-blue-500"
                                                            />
                                                            {errors.price && touched.price && (
                                                                <p className="text-red-500 text-sm">{errors.price}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <Label htmlFor="stockQuantity">Stock Quantity</Label>
                                                            <Input
                                                                id="stockQuantity"
                                                                name="stockQuantity"
                                                                type="number"
                                                                onChange={handleChange}
                                                                value={values.stockQuantity}
                                                                className="mt-1 border border-blue-500"
                                                            />
                                                            {errors.stockQuantity && touched.stockQuantity && (
                                                                <p className="text-red-500 text-sm">{errors.stockQuantity}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Category */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="category">Category</Label>
                                                            <Input
                                                                id="category"
                                                                name="category"
                                                                onChange={handleChange}
                                                                value={values.category}
                                                                className="mt-1 border border-blue-500"
                                                            />
                                                            {errors.category && touched.category && (
                                                                <p className="text-red-500 text-sm">{errors.category}</p>
                                                            )}
                                                        </div>


                                                        {/* Item No */}
                                                        <div>
                                                            <Label htmlFor="itemNo">Item No</Label>
                                                            <Input
                                                                id="itemNo"
                                                                name="itemNo"
                                                                onChange={handleChange}
                                                                value={values.itemNo}
                                                                className="mt-1 border border-blue-500"
                                                            />
                                                            {errors.itemNo && touched.itemNo && (
                                                                <p className="text-red-500 text-sm">{errors.itemNo}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <Label htmlFor="status">Status</Label>
                                                            <Select
                                                                value={values.status}
                                                                onValueChange={(value) => setFieldValue("status", value)}
                                                            >
                                                                <SelectTrigger className="mt-1 border border-blue-500 w-full">
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                                                    <SelectItem value="active">Active</SelectItem>
                                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            {touched.status && errors.status && (
                                                                <p className="text-sm text-red-600">{errors.status}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Buttons */}
                                                    <div className="flex justify-end space-x-4">
                                                        <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); setSelectedInventory(null) }}>
                                                            Cancel
                                                        </Button>
                                                        <Button type="submit" className="bg-blue-500 hover:bg-blue-600">
                                                            {selectediInventory ? "Update" : "Add"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            )}
                                        </Formik>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Inventory List */}
                            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                                {(searchTerm ? searchItem : tuckShopItems)?.length > 0 ? (
                                    (searchTerm ? searchItem : tuckShopItems)?.map((item) => (
                                        <div key={item._id} className="border rounded-lg p-4 border-[#3498db]">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-4">
                                                    <h4 className="font-semibold text-lg">{item.itemName}</h4>
                                                    <span
                                                        className={`${item?.status === "Active" ? "bg-green-500" : "bg-red-500"} text-[12px] py-1 text-white px-2 rounded`}
                                                    >
                                                        {item?.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-lg">₹{item.price}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="text-sm text-gray-600 mb-1">Stock: {item.stockQuantity}</div>
                                                <div className="text-sm text-gray-600 mb-1">Item No: {item.itemNo}</div>
                                            </div>
                                            {/* <div className="flex items-center justify-between">
                                                {item.description && (
                                                    <div className="text-sm text-gray-500">{item.description}</div>
                                                )}
                                                <Edit
                                                    className="w-4 h-4 text-gray-600 cursor-pointer"
                                                    onClick={() => {
                                                        setIsFormOpen(userRole === "ADMIN");
                                                        setSelectedInventory(item);
                                                    }}
                                                />
                                            </div> */}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-4">No data found</p>
                                )}

                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>

            {openFaceId && (
                <FaceRecognition mode="match" open={openFaceId} setOpen={setOpenFaceId} setFaceIdData={setFaceIdData} />
            )}
        </div>
    )
}
export default TuckShopPos
