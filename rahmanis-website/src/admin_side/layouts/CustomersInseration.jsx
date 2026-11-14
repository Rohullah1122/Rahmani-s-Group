// src/admin_side/layouts/Customers.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

 function CustomersInseration() {
  const [customers, setCustomers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    customer_id :"",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

useEffect(() => {
    fetchCustomers();
}, []);

  const fetchCustomers = () => {
    axios.get("/api/selectcustomer")
      .then(res => setCustomers(res.data))
      .catch(err => console.error("Error fetching customers:", err));
  };


 



  // Open dialog for Add / Edit
const handleOpen = (index = null) => {
  if (index !== null) {
    setFormData(customers[index]);   // load existing customer data
    setEditingIndex(index);          // ✅ mark as edit mode
  } else {
    setFormData({
      customer_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: ""
    });
    setEditingIndex(null);           // ✅ mark as add mode
  }
  setOpen(true);
};





const handleSave = () => {
  const { customer_id, first_name, last_name, email, phone } = formData;

  if (first_name.trim() && last_name.trim() && email.trim() && phone.trim()) {
    if (editingIndex !== null) {
      axios.put(`/api/selectcustomerupdate/${customer_id}`, formData)
        .then(res => {
          setOpen(false);
          console.log(res.data.message);
          fetchCustomers();
        })
        .catch(err => console.error(err));
    } else {
      // 🟢 INSERT new customer
      axios.post("/api/customerinseration", formData)
        .then(res => {
          setOpen(false);
          console.log(res.data.message);
          fetchCustomers();
        })
        .catch(err => console.error(err));
    }
  } else {
    alert("Fill all the textboxes");
  }
};



  //work on this form and make it for customer

  // Delete customer
    const handleDelete = (index) => {
    const customer_id = customers[index].customer_id; 
    if(customer_id !=null){
      axios.delete(`/api/delete/${customer_id}`)
  .then(res =>{
             console.log(res.data.message);
             fetchCustomers();
        })
        .catch(err => console.error(err));
      }

    }


  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Customer Management
      </Typography>

      <Button variant="contained" color="primary" onClick={() => handleOpen()}>
        + Add Customer
      </Button>

      {/* Customers Table */}
      <TableContainer component={Paper} sx={{ marginTop: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
             <TableCell>Cutomer-ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Last Name</TableCell>
               <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((cust, index) => (
              <TableRow key={index}>
                  <TableCell>{cust.customer_id}</TableCell>
                <TableCell>{cust.first_name}</TableCell>
                   <TableCell>{cust.last_name}</TableCell>
                <TableCell>{cust.email}</TableCell>
                <TableCell>{cust.phone}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpen(index)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(index)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No customers added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingIndex !== null ? "Edit Customer" : "Add Customer"}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            name="first_name"
            fullWidth
            value={formData.first_name}
            onChange={handleChange}
             required
          />

            <TextField
                margin="dense"
                label="Last-Name"
                name="last_name"
                fullWidth
                value={formData.last_name}
                onChange={handleChange}
                required
              />

          <TextField
            margin="dense"
            label="Email"
            name="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
             required
          />
          <TextField
            margin="dense"
            label="Phone"
            name="phone"
            fullWidth
            value={formData.phone}
            onChange={handleChange}
             required
          />

   
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


export default CustomersInseration;
