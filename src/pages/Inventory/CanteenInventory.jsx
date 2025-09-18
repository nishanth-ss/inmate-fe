import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../../components/UI/table";
import { useState } from "react";
import { Button } from "../../components/UI/button";
import { Edit, Plus, Trash2 } from "lucide-react";
import { TablePagination } from "@mui/material";
import CanteenModal from "./CanteenModal";
import useFetchData from "@/hooks/useFetchData";
import { useHandleDelete } from "@/hooks/useHandleDelete";
import { useSnackbar } from "notistack";

function CanteenInventory() {
  // 🔹 Dummy data for now
  const [inventory, setInventory] = useState([
    {
      _id: "1",
      itemName: "Chips",
      price: 20,
      stock_quantity: 50,
      category: "Snacks",
      item_no: "ITM-001",
      total_stock: 100,
      status: "Active",
    },
    {
      _id: "2",
      itemName: "Coke",
      price: 40,
      stock_quantity: 100,
      category: "Beverages",
      item_no: "ITM-002",
      total_stock: 100,
      status: "Inactive",
    },
  ]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState();
  const [refetch, setRefetch] = useState(0);
  const { data, error } = useFetchData(`inventory/canteen`, refetch);
  const { enqueueSnackbar } = useSnackbar();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="w-full bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-8xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setOpen(true)} className="bg-blue-500"><Plus className="w-4 h-4 mr-2" />Create Canteen Item</Button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center font-semibold">S.NO</TableHead>
                <TableHead className="text-center font-semibold">Item Name</TableHead>
                <TableHead className="text-center font-semibold">Price</TableHead>
                <TableHead className="text-center font-semibold">Stock Quantity</TableHead>
                <TableHead className="text-center font-semibold">Category</TableHead>
                <TableHead className="text-center font-semibold">Item No</TableHead>
                <TableHead className="text-center font-semibold">Status</TableHead>
                <TableHead className="text-center font-semibold">Total Stock</TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.length > 0 ? (
                data?.map((item, index) => (
                  <TableRow key={item._id} className="hover:bg-gray-50">
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="text-center">{item.itemName}</TableCell>
                    <TableCell className="text-center">₹{item.price}</TableCell>
                    <TableCell className="text-center">{item.stockQuantity}</TableCell>
                    <TableCell className="text-center">{item.category}</TableCell>
                    <TableCell className="text-center">{item.itemNo}</TableCell>
                    <TableCell
                      className={`text-center font-semibold ${item.status === "Active" ? "text-green-600" : "text-red-500"
                        }`}
                    >
                      {item.status}
                    </TableCell>
                    <TableCell className="text-center">{item.totalQty}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 !cursor-pointer" onClick={()=>{setOpen(true),setSelectedData(item)}}>
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-4">
                    No inventory items found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TablePagination
        component="div"
        count={data?.length || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <CanteenModal open={open} setOpen={setOpen} selectedItem={selectedData} setSelectedItem={setSelectedData} setRefetch={setRefetch} refetch={refetch} />
    </div>
  );
}

export default CanteenInventory;
