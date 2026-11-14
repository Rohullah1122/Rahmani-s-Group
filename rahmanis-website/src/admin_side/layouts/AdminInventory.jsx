import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, TextField, Box, InputAdornment, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, Select
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

function AdminInventory() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
const [originalRow, setOriginalRow] = useState(null);
  useEffect(() => {
    axios
      .get("/api/SelectInventory")
      .then((res) => setRows(res.data))
      .catch((err) => console.error("Error fetching inventory:", err));
  }, []);

  const filteredRows = rows.filter((row) =>
    (row.part_name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

const handleRowDoubleClick = (row) => {
  setSelectedRow({ ...row });
  setOriginalRow({ ...row }); // for comparison later
  setOpenDialog(true);
};

  const handleSave = async () => {
    try {
      await axios.put(
        `/api/inventoryupdate/${selectedRow.inventory_id}`,
        {
          quantity: selectedRow.quantity,
          status: selectedRow.status,
          Make : selectedRow.make,
          Model : selectedRow.model
        }
        
      );
              console.log("This is inventory ID " + selectedRow.inventory_id);
              console.log("Customer ID:", selectedRow.make);
                  console.log("Customer ID:", selectedRow.model);
      setOpenDialog(false);
      alert("Inventory updated!");
      // Refresh table
      const res = await axios.get("/api/SelectInventory");
      setRows(res.data);
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update inventory");
    }
  };

  //inventory is good 

  const hasChanges =
  selectedRow &&
  originalRow &&
  (selectedRow.quantity !== originalRow.quantity ||
   selectedRow.status !== originalRow.status);


  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Inventory Management
      </Typography>

      {/* Search Bar */}
      <Box sx={{ marginBottom: 3, display: "flex", justifyContent: "flex-end" }}>
        <TextField
          label="Search Product"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="inventory table">
          <caption style={{ captionSide: "top", fontSize: "1.1rem", padding: "8px" }}>
            List of all products in inventory
          </caption>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#1976d2" }}>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Part Name</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Inventory ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Part ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Quantity</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Condition</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Price</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cost Price</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Car</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Make</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Model</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Supplier</TableCell>
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, index) => (
                <TableRow key={index} hover onDoubleClick={() => handleRowDoubleClick(row)}>
                  <TableCell>{row.part_name}</TableCell>
                  <TableCell>{row.inventory_id}</TableCell>
                  <TableCell>{row.part_id}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.condition}</TableCell>
                  <TableCell>{row.part_price}</TableCell>
                  <TableCell>{row.cost_price}</TableCell>
                  <TableCell>{row.car_id}</TableCell>
                  <TableCell>{row.make}</TableCell>
                  <TableCell>{row.model}</TableCell>
                  <TableCell>{row.supplier_name}</TableCell>
                  <TableCell>{row.status}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>Edit Inventory Item</DialogTitle>
        <DialogContent dividers>
          {selectedRow && (
            <>
              <TextField label="Part Name" fullWidth margin="dense" value={selectedRow.part_name} disabled />
              <TextField label="Condition" fullWidth margin="dense" value={selectedRow.condition} disabled />
               <TextField label="Make" fullWidth margin="dense" value={selectedRow.make} disabled />
                <TextField label="Model" fullWidth margin="dense" value={selectedRow.model} disabled />
            <TextField
            label="Quantity"
            type="number"
            fullWidth
            margin="dense"
            value={selectedRow.quantity}
            onChange={(e) => {
              const newQty = parseInt(e.target.value, 10);
              setSelectedRow({
                ...selectedRow,
                quantity: newQty,
                status: newQty > 0 ? "In Stock" : "Out of Stock",
              });
            }}
          />

<Select
  fullWidth
  value={selectedRow.status}
  onChange={(e) =>
    setSelectedRow({ ...selectedRow, status: e.target.value })
  }
  sx={{ mt: 2 }}
>
  <MenuItem value="In Stock">In Stock</MenuItem>
  <MenuItem value="Out of Stock">Out of Stock</MenuItem>
</Select>

            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges} // <---- Disable if no changes
        >
          Save
        </Button>

        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminInventory;
