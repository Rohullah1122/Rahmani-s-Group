import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  TextField,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

const Payments = () => {
  // hooks
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [vehicals, setVehicals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);


  // hookstotal
  const [totals, setTotals] = useState({
    totalSales: 0,
    totalPending: 0,
    amountPaid: 0,
  });
    const [inventory, setinventory] = useState({
    part_id: 0,
    Quantity: 0,
    status: 0,
  });
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");


  // formdata
  const [form, setForm] = useState({
    date: "",
    customer: "",
    model: "",
    product: "",
    quantity: "",
    price: "",
    payment_method: "",
    amountPaid: "",
    pending: "",
    stock: "",
  });

  // Fetch all data
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchCars();
    fetchSales();
    fetchPayments();
    fetchcalculation();

  }, []);

  const fetchCustomers = () => {
    axios
      .get("/api/selectcustomer")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Error fetching customers:", err));
  };



const handleOpenDialog = (tx) => {
  setSelectedTx(tx);      // pass the transaction object
  setOpenDialog(true);    // open dialog
};



const fetchInventory = (part_id) => {
  axios
    .get(`/api/getinventory/${part_id}`)
    .then((res) => {
      if (res.data && res.data.length > 0) {
        setinventory(res.data[0]); // take the first row
        console.log(res.data[0].quantity + " stock is this");
      } else {
        setinventory({ part_id: 0, Quantity: 0, status: 0 });
      }
    })
    .catch((err) => console.error("Error fetching inventory:", err));
};







  const fetchcalculation = () => {
    axios
      .get("/api/getcalcluation")
      .then((res) => {
        const data = res.data[0]; // recordset returns an array with one row
        setTotals({
          totalSales: data.total_sales || 0,
          totalPending: data.total_pending || 0,
          amountPaid: data.amount_paid || 0,
        });
      })
      .catch((err) => console.error("Error fetching calculation:", err));
  };

  const fetchProducts = () => {
    fetch("/api/parts")
      .then((res) => res.json())
      .then((data) => setProducts(data.recordset || data))
      .catch((err) => console.error("Error fetching parts:", err));
  };

  const fetchCars = () => {
    fetch("/api/vehicals")
      .then((res) => res.json())
      .then((data) => setVehicals(data.recordset || data))
      .catch((err) => console.error("Error fetching vehicals:", err));
  };

  const fetchSales = () => {
    axios
      .get("/api/getsales")
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error("Error fetching sales:", err));
  };

  const fetchPayments = () => {
    axios
      .get("/api/getpayment")
      .then((res) => setPayments(res.data))
      .catch((err) => console.error("Error fetching payments:", err));
  };

          useEffect(() => {
                  if (selectedTx?.part_id) {
                    fetchInventory(selectedTx.part_id);  // <-- fetch stock for product
                  }
                }, [selectedTx?.part_id]);

  // Filter products by vehicle
  const filteredProducts = form.model
    ? products.filter((p) => p.car_id === form.model)
    : products;

// Auto-fill price
useEffect(() => {
  const selected = products.find((p) => p.part_id === form.product);
  if (selected) {
    const total =
      form.quantity && form.quantity > 0
        ? selected.selling_price * form.quantity
        : selected.selling_price;
    setForm((prev) => ({ ...prev, price: total }));
  }
}, [form.product, form.quantity, products]);


  // Auto-calc pending
  useEffect(() => {
    if (form.amountPaid !== "" && form.price !== "") {
      const pendingAmount = form.price - form.amountPaid;
      setForm((prev) => ({
        ...prev,
        pending: pendingAmount >= 0 ? pendingAmount : 0,
      }));
    }
  }, [form.amountPaid, form.price]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save transaction
  const saveTransaction = () => {
    const requiredFields = ["date", "customer", "model", "product", "quantity", "payment_method", "amountPaid"];
    const allFilled = requiredFields.every((field) => form[field] !== "");
    if (!allFilled) {
      alert("Please fill all the fields.");
      return;
    }

    //working on this button for saving transction

    

    const selectedCustomer = customers.find(
      (c) => c.customer_id == form.customer
    );
    const selectedProduct = products.find((p) => p.part_id === form.product);

        // fetchinventory(selectedProduct);
    const payload = {
      customer_id: selectedCustomer.customer_id,
      part_id: selectedProduct.part_id,
      car_id: form.model,
      sale_date: form.date,
      quantity: Number(form.quantity),
      price_sold: Number(form.price),
      amount_paid: Number(form.amountPaid),
      pending: Number(form.pending),
      payment_method: form.payment_method,
      status: form.pending > 0 ? "Partial" : "Paid",
    };

    if (form.quantity > inventory.quantity && inventory.quantity == 0) {

      alert("we only have"+ inventory.quantity +" " +"in our stock" +"and you entered" +form.quantity);

    }else{


          axios
      .post("/api/salesinseration", payload)
      .then((res) => {
        console.log(res.data.message);
        setTransactions((prev) => [payload, ...prev]);
        setForm({
          date: "",
          customer: "",
          model: "",
          product: "",
          quantity: "",
          price: "",
          payment_method: "",
          amountPaid: "",
          pending: "",
          stock: "",
        });
      })
    .catch((err) => console.error("Error sending transaction:", err));

          //  alert("this is inventory stock" +inventory.quantity +"and this is " + form.quantity);

    //
          // 
    }
  };

  // Search filter
  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());

  const filteredTransactions = transactions.filter((tx) => {
    const customer = customers.find((c) => c.customer_id === tx.customer_id);
    const product = products.find((p) => p.part_id === tx.part_id);
    const car = vehicals.find((v) => v.car_id === product?.car_id);

    const customerName = customer
      ? `${customer.first_name} ${customer.last_name}`
      : "";
    const productName = product ? product.part_name : "";
    const modelName = car ? car.model : "";
    const status = tx.status || "";

    return `${customerName} ${productName} ${modelName} ${status}`
      .toLowerCase()
      .includes(searchTerm);
  });




  const handleUpdateTransaction = (updatedTx) => {
  axios
    .put(`/api/updatesale/${updatedTx.sale_id}`, updatedTx)
    .then((res) => {
      console.log("Updated:", res.data);

      // Update local state
      setTransactions((prev) =>
        prev.map((tx) => (tx.sale_id === updatedTx.sale_id ? updatedTx : tx))
      );

      setOpenDialog(false);
    })
    .catch((err) => console.error("Error updating transaction:", err));
};




// inside your component
const handleUpdateSale = async () => {
  try {
    const response = await axios.put(
      `/api/salesupdate/${selectedTx.sale_id}`, 
      {
        customer_id: selectedTx.customer_id,
        part_id: selectedTx.part_id,
        car_id: selectedTx.car_id,
        sale_date: selectedTx.sale_date,
        quantity: selectedTx.quantity,
        price_sold: selectedTx.price_sold,
        amount_paid: selectedTx.Amount_paid,      // ✅ lowercase
        pending: selectedTx.Amount_pending,       // ✅ lowercase
        payment_method: selectedTx.payment_id,    // ✅ just send ID
        status: selectedTx.status,
      }
    );

    console.log("Customer ID:", selectedTx.customer_id);
    console.log("Part ID:", selectedTx.part_id);
    console.log("Car ID:", selectedTx.car_id);
    console.log("Sale Date:", selectedTx.sale_date);
    console.log("Quantity:", selectedTx.quantity);
    console.log("Price Sold:", selectedTx.price_sold);
    console.log("Amount Paid:", selectedTx.Amount_paid);
    console.log("Pending:", selectedTx.Amount_pending);
    console.log("Payment Method:", selectedTx.payment_id);
    console.log("Status:", selectedTx.status);

    // refresh sales list
    fetchSales();

    // close dialog
    setOpenDialog(false);
  } catch (error) {
    console.error("Update error:", error);
    alert("Failed to update sale");
  }
};




// Put this helper in the same file (outside the component or at top)
const toDateInputValue = (val) => {
  if (!val) return "";

  // If it's already "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

  // If it's ISO-like "YYYY-MM-DDTHH:mm:ss..."
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(val);
  if (m) return m[1];

  // Fallback: adjust for timezone before slicing
  const d = new Date(val);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 10); // safe now
};




  return (
    <div className="container py-4">
      {/* Header */}
    

      <div className="row">
        {/* New Transaction Form */}
        <div className="col-md-6 mb-4">
          <h5>New Sale</h5>
          <div className="d-flex flex-column gap-3">
            <TextField
              type="date"
              name="date"
              value={form.date}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
            />

            {/* Customer Dropdown */}
            <Select
              name="customer"
              value={form.customer}
              onChange={handleInputChange}
              displayEmpty
            >
              <MenuItem value="">Select Customer</MenuItem>
              {customers.map((cust) => (
                <MenuItem key={cust.customer_id} value={cust.customer_id}>
                  {cust.first_name + " " + cust.last_name}
                </MenuItem>
              ))}
            </Select>

            {/* Vehicle Model Dropdown */}
            <Select
              name="model"
              value={form.model}
              onChange={handleInputChange}
              displayEmpty
            >
              <MenuItem value="">Select Vehicle</MenuItem>
              {vehicals.map((v) => (
                <MenuItem key={v.car_id} value={v.car_id}>
                  {v.model}
                </MenuItem>
              ))}
            </Select>

      {/* Product Dropdown */}
        <Select
  name="product"
  value={form.product}
  onChange={(e) => {
    handleInputChange({
      target: { name: "product", value: e.target.value }
    });
    fetchInventory(e.target.value); // directly pass part_id
  }}
  displayEmpty
>
  <MenuItem value="">Select Product</MenuItem>

  {form.model
    ? filteredProducts.map((prod) => (
        <MenuItem key={prod.part_id} value={prod.part_id}>
          {prod.part_id} - {prod.part_name}
        </MenuItem>
      ))
    : (
        <MenuItem disabled>Please select the vehicle first</MenuItem>
      )
  }
</Select>





            <div className="row">
              <div className="col">
                <TextField
                  type="number"
                  label="Quantity"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>
              <div className="col">
              <TextField
                type="number"
                name="stock"
                value={inventory.quantity || 0}
                fullWidth
                disabled
              />

              </div>

            </div>

            <TextField
              type="number"
              label="Price"
              name="price"
              value={form.price}
              fullWidth
              disabled
            />

            {/* Payment */}
            <TextField
              type="number"
              label="Amount Paid"
              name="amountPaid"
              value={form.amountPaid}
              onChange={handleInputChange}
              fullWidth
            />

            <TextField
              type="number"
              label="Pending"
              name="pending"
              value={form.pending}
              fullWidth
              disabled
            />

      


            <Select
              name="payment_method"
              value={form.payment_method}
              onChange={handleInputChange}
              displayEmpty
            >
              <MenuItem value="">Payment Method</MenuItem>
              <MenuItem value="1">Cash</MenuItem>
              <MenuItem value="2">Card</MenuItem>
              <MenuItem value="3">Bank Transfer</MenuItem>
            </Select>

            <div className="d-flex gap-2">
              <Button
                variant="contained"
                color="primary"
                onClick={saveTransaction}
              >
                Save Sale
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  setForm({
                    date: "",
                    customer: "",
                    model: "",
                    product: "",
                    quantity: "",
                    price: "",
                    payment_method: "",
                    amountPaid: "",
                    pending: "",
                    stock: "",
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions Overview */}
        <div className="col-md-6 mb-4">
          <h5>Transactions Overview</h5>
          <TextField
            placeholder="Search"
            fullWidth
            className="mb-3"
            value={searchTerm}
            onChange={handleSearch}
          />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>Payment_Method</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredTransactions.map((tx) => { 
                const customer = customers.find(
                  (c) => c.customer_id === tx.customer_id
                );
                const product = products.find((p) => p.part_id === tx.part_id);
                const car = vehicals.find((v) => v.car_id === product?.car_id);
                const Payment_Type = payments.find((p) => p.payment_id == tx.payment_id);

                const formattedDate = tx.sale_date
                  ? new Date(tx.sale_date).toLocaleDateString("en-GB")
                  : "N/A";

                return (
             
                  // work on pending payment and payment_method
      <TableRow
  key={tx.sale_id}
  onDoubleClick={() => {
    const product = products.find((p) => p.part_id === tx.part_id);
    const carId = product?.car_id || "";
    const formattedTx = {
      ...tx,
      sale_date: toDateInputValue(tx.sale_date), // timezone-safe helper you wrote
      customer_id: tx.customer_id || "",
      car_id: carId,              // <-- derive car_id from product
      part_id: tx.part_id || "",
      payment_id : tx.payment_id,
    };

    setSelectedTx(formattedTx);
    setOpenDialog(true);
  }}
>




                  
                    <TableCell>{formattedDate}</TableCell>
                    <TableCell>
                      {customer
                        ? `${customer.first_name} ${customer.last_name}`
                        : "Unknown"}
                    </TableCell>
                    <TableCell>{car ? car.model : "N/A"}</TableCell>
                    <TableCell>{product ? product.part_name : "N/A"}</TableCell>
                    <TableCell>{tx.quantity}</TableCell>
                    <TableCell>${tx.price_sold}</TableCell>
                    <TableCell>${tx.Amount_paid}</TableCell>
                    <TableCell>${tx.Amount_pending}</TableCell>
                   <TableCell> {Payment_Type ? Payment_Type.payment_method : "Unknown"}  </TableCell>
                   <TableCell>{tx.status}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Typography
            variant="body2"
            color="textSecondary"
            align="right"
            className="mt-2"
          >
            1-{filteredTransactions.length} of {filteredTransactions.length}
          </Typography>
        </div>
      </div>

      {/* Summary */}
      <div className="row mt-4">
        <div className="col-md-4">
          <Card>
            <CardContent className="text-center">
              <Typography>Total Sales</Typography>
              <Typography variant="h6">${totals.totalSales}</Typography>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-4">
          <Card>
            <CardContent className="text-center">
              <Typography>Pending Payments</Typography>
              <Typography variant="h6">${totals.totalPending}</Typography>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-4">
          <Card>
            <CardContent className="text-center">
              <Typography>Amount Paid</Typography>
              <Typography variant="h6">${totals.amountPaid}</Typography>
            </CardContent>
          </Card>
        </div>
      </div>


   
<Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
  <DialogTitle>Edit Sale Details</DialogTitle>
  <DialogContent dividers>
    {selectedTx && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
         

      {[
  { label: 'Sale Date', type: 'date', key: 'sale_date' },
  { 
    label: 'Customer', 
    type: 'dropdown', 
    key: 'customer_id', 
    options: customers.map(c => ({ value: c.customer_id, label: c.first_name + ' ' + c.last_name })) 
  },
  { 
    label: 'Vehicle', 
    type: 'dropdown', 
    key: 'car_id', 
    options: vehicals.map(v => ({ value: v.car_id, label: v.model })) 
  },
{ 
  label: 'Payment Type', 
  type: 'dropdown', 
  key: 'payment_id', 
  options: payments.map(v => ({ value: v.payment_id, label: v.payment_method })) 
},
  { 
    label: 'Product', 
    type: 'dropdown', 
    key: 'part_id',
    options: products
      .filter(p => p.car_id === selectedTx?.car_id)
      .map(p => ({ value: p.part_id, label: p.part_name }))
  },
  { label: 'Quantity', type: 'number', key: 'quantity' },
  { label: 'Price', type: 'number', key: 'price_sold' },
  { label: 'Amount Paid', type: 'number', key: 'Amount_paid' },
  { label: 'Stock', type: 'readonly', key: 'stock' },
  { label: 'Pending', type: 'number', key: 'Amount_pending' },
  { label: 'Status', type: 'text', key: 'status' },
].map((field) => {
  if (field.type === 'dropdown') {
    return (
      <Select
        key={field.key}
        value={selectedTx[field.key] || ''}
        onChange={(e) => {
          if (field.key === 'car_id') {
            setSelectedTx({ 
              ...selectedTx, 
              car_id: Number(e.target.value), 
              part_id: '' 
            });
          } else {
            setSelectedTx({ ...selectedTx, [field.key]: Number(e.target.value) });
          }
        }}
        fullWidth
        displayEmpty
      >
        <MenuItem value="" disabled>{field.label}</MenuItem>
        {field.options.length > 0 ? (
          field.options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            {field.key === 'part_id' ? 'No parts available for this vehicle' : 'No options'}
          </MenuItem>
        )}
      </Select>
    );
  } else if (field.type === 'readonly') {
    return (
      <TextField
        key={field.key}
        label={field.label}
        value={inventory?.quantity || 0}
        fullWidth
        size="small"
        InputProps={{ readOnly: true }}
      />
    );
  } else {
    return (
      <TextField
        key={field.key}
        label={field.label}
        type={field.type}
        value={selectedTx[field.key] || ''}
        onChange={(e) => {
          let updatedTx = { ...selectedTx, [field.key]: e.target.value };

          // 👉 Auto-update pending when Amount Paid changes
      if (field.key === "Amount_paid") {
        const paid = Number(e.target.value) || 0;
        const price = Number(selectedTx.price_sold) || 0;
         updatedTx.Amount_pending = price - paid;



  // 👉 update status automatically
          if (paid >= price) {
            updatedTx.status = "Paid";

          } else if (paid > 0 && paid < price) {
            updatedTx.status = "Partially Paid";
          } else {
            updatedTx.status = "Unpaid";
          }

         
}


          setSelectedTx(updatedTx);
        }}
        InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
        fullWidth
      />
    );
  }
})}


 
        </div>
      </div>
    )}
  </DialogContent>


  <DialogActions>
    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
      <Button 
        onClick={handleUpdateSale} 
        variant="contained" 
        color="primary"
      >
        Save Changes
      </Button>

  </DialogActions>
</Dialog>



    
    {/* work on dialogue as its need works selecting and updating all elements */}
    
    
    </div>
  );
};

export default Payments;
