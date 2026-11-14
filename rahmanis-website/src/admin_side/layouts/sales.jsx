import React, { useState, useEffect } from "react";
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
  // Example: replace with API call to fetch customers & products
  const [customers, setCustomers] = useState(["John Doe", "Jane Smith", "Alice"]);
  const [products, setProducts] = useState([
    { name: "Product A", price: 100 },
    { name: "Product B", price: 250 },
    { name: "Product C", price: 300 },
  ]);

  const [transactions, setTransactions] = useState([]);

  const [form, setForm] = useState({
    date: "",
    customer: "",
    product: "",
    quantity: "",
    price: "",
    paymentMethod: "",
  });

  // auto-fill price when product changes
  useEffect(() => {
    const selected = products.find((p) => p.name === form.product);
    if (selected) {
      setForm((prev) => ({ ...prev, price: selected.price }));
    }
  }, [form.product]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveTransaction = () => {
    const newTx = {
      date: form.date,
      id: `TX${Math.floor(Math.random() * 10000)}`,
      type: "Sale",
      customer: form.customer,
      product: form.product,
      quantity: Number(form.quantity),
      price: Number(form.price),
      status: "Paid",
    };
    setTransactions([newTx, ...transactions]);
    setForm({
      date: "",
      customer: "",
      product: "",
      quantity: "",
      price: "",
      paymentMethod: "",
    });
  };

  const totalSales = transactions.reduce((acc, tx) => acc + tx.price, 0);
  const pendingPayments = 0; // placeholder
  const profitLoss = totalSales; // since only sales

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Payments</h2>
        <div>
          <Button variant="contained" color="primary" className="me-2">
            + New Transaction
          </Button>
          <Button variant="outlined">Export PDF</Button>
        </div>
      </div>

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
              {customers.map((cust, idx) => (
                <MenuItem key={idx} value={cust}>
                  {cust}
                </MenuItem>
              ))}
            </Select>

            {/* Product Dropdown */}
            <Select
              name="product"
              value={form.product}
              onChange={handleInputChange}
              displayEmpty
            >
              <MenuItem value="">Select Product</MenuItem>
              {products.map((prod, idx) => (
                <MenuItem key={idx} value={prod.name}>
                  {prod.name}
                </MenuItem>
              ))}
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
                  label="Price"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  fullWidth
                  disabled // auto-filled from product
                />
              </div>
            </div>

            <Select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleInputChange}
              displayEmpty
            >
              <MenuItem value="">Payment Method</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Card">Card</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
            </Select>

            <div className="d-flex gap-2">
              <Button variant="contained" color="primary" onClick={saveTransaction}>
                Save Sale
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  setForm({
                    date: "",
                    customer: "",
                    product: "",
                    quantity: "",
                    price: "",
                    paymentMethod: "",
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
          <TextField placeholder="Search" fullWidth className="mb-3" />
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.date}</TableCell>
                  <TableCell>{tx.id}</TableCell>
                  <TableCell>{tx.customer}</TableCell>
                  <TableCell>{tx.product}</TableCell>
                  <TableCell>{tx.quantity}</TableCell>
                  <TableCell>${tx.price}</TableCell>
                  <TableCell>{tx.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Typography
            variant="body2"
            color="textSecondary"
            align="right"
            className="mt-2"
          >
            1-{transactions.length} of {transactions.length}
          </Typography>
        </div>
      </div>

      {/* Summary */}
      <div className="row mt-4">
        <div className="col-md-4">
          <Card>
            <CardContent className="text-center">
              <Typography>Total Sales</Typography>
              <Typography variant="h6">${totalSales}</Typography>
            </CardContent>
          </Card>
        </div>
        <div className="col-md-4">
          <Card>
            <CardContent className="text-center">
              <Typography>Pending Payments</Typography>
              <Typography variant="h6">${pendingPayments}</Typography>
            </CardContent>
          </Card>
        </div>
        <div className="col-md-4">
          <Card>
            <CardContent className="text-center">
              <Typography>Profit/Loss</Typography>
              <Typography variant="h6">${profitLoss}</Typography>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payments;
