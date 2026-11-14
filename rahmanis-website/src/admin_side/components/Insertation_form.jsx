import React, { useState } from 'react';
import {
  TextField, MenuItem, Select, InputLabel,
  FormControl, Checkbox, ListItemText, Button
} from '@mui/material';
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { shrinkImage } from "../../utils/files";

function Insertion_form() {
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectYear, setSelectYear] = useState('');
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState('');
  const [inventoryStock, setInventoryStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [sellingPrice, setSellingPrice] = useState('');

  const car_parts = [{ make: '', partName: [] }];

  const carCompanies = [
    "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "Hyundai", "Kia", "Mazda",
    "Subaru", "Volkswagen", "Dodge", "Ram", "Chrysler", "GMC", "Buick", "Jeep"
  ];

  const carModels = [
    { make: "Toyota", models: ["Camry", "Corolla", "RAV4", "Highlander", "Prius"] },
    { make: "Honda", models: ["Civic", "Accord", "CR-V", "Pilot", "Fit"] },
    { make: "Ford", models: ["F-150", "Mustang", "Escape", "Explorer", "Fusion"] },
    { make: "Chevrolet", models: ["Silverado", "Malibu", "Equinox", "Camaro", "Traverse"] },
    { make: "Nissan", models: ["Altima", "Rogue", "Sentra", "Pathfinder", "Murano"] },
    { make: "Volkswagen", models: ["Golf", "Passat", "Tiguan", "Jetta", "Atlas"] },
    { make: "Hyundai", models: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona"] },
    { make: "Kia", models: ["Soul", "Sportage", "Sorento", "Optima", "Telluride"] },
    { make: "Subaru", models: ["Outback", "Forester", "Impreza", "Crosstrek", "WRX"] },
    { make: "Mazda", models: ["Mazda3", "Mazda6", "CX-5", "CX-9", "MX-5 Miata"] },
    { make: "Jeep", models: ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade"] },
    { make: "Dodge", models: ["Charger", "Challenger", "Durango", "Journey", "Ram 1500"] }
  ];

  const years = Array.from({ length: 26 }, (_, i) => 2000 + i);
  const partNames = ["Engine", "Transmission", "Battery", "Tire", "Brake Pad"];

  const getModelsForMake = (make) => {
    const found = carModels.find(c => c.make === make);
    return found ? found.models : [];
  };

  const handlePartChange = (event) => {
    const {
      target: { value }
    } = event;
    setSelectedParts(typeof value === 'string' ? value.split(',') : value);
  };

  const location = useLocation();
const carData = location.state?.car; // 👈 Get the passed car object




useEffect(() => {
  if (carData) {
    setSelectedMake(carData.make || '');
    setSelectedModel(carData.model || '');
    setSelectYear(carData.year || '');
    document.getElementById("supplierName").value = carData.seller_name;
    document.getElementById("supplierPhone").value = carData.phone;
    document.getElementById("supplierEmail").value = carData.email;
    document.getElementById("supplierAddress").value = carData.location;
  }
}, [carData]);

//work on when i press purchase button it should take me to insertation form file with data



const Submited = async (e) => {
  e.preventDefault();

  try {
    const supplierName = document.getElementById('supplierName')?.value.trim();
    const supplierPhone = document.getElementById('supplierPhone')?.value.trim();
    const supplierEmail = document.getElementById('supplierEmail')?.value.trim();
    const supplierAddress = document.getElementById('supplierAddress')?.value.trim();
    const vinNumber = document.getElementById('vinNumber')?.value.trim();
    const purchaseDate = document.getElementById('purchaseDate')?.value;
    const purchasePrice = parseFloat(document.getElementById('purchasePrice')?.value);
    const costPrice = parseFloat(document.getElementById('costPrice')?.value);
    const imageFile = document.getElementById('imagePath')?.files[0];

    if (!imageFile) return alert("Image is required.");

    // Parse selling prices
    const prices = sellingPrice.split(',').map(p => parseFloat(p.trim()));
    if (prices.some(p => isNaN(p))) return alert("All selling prices must be valid numbers.");

    const partsWithPrices = selectedParts.map((part, index) => ({
      name: part,
      price: prices[index]
    }));

    // Use FormData for file + data
    const formData = new FormData();
    formData.append("supplierName", supplierName);
    formData.append("supplierPhone", supplierPhone);
    formData.append("supplierEmail", supplierEmail);
    formData.append("supplierAddress", supplierAddress);
    formData.append("make", selectedMake);
    formData.append("model", selectedModel);
    formData.append("year", selectYear);
    formData.append("vinNumber", vinNumber);
    formData.append("purchaseDate", purchaseDate);
    formData.append("purchasePrice", purchasePrice);
    formData.append("condition", condition);
    formData.append("costPrice", costPrice);
    formData.append("status", status);
    formData.append("quantity", quantity);
    formData.append("inventoryStock", inventoryStock);

    // stringify arrays/objects
    formData.append("sellingPrices", JSON.stringify(prices));
    formData.append("parts", JSON.stringify(partsWithPrices));

    // attach file (multer will see it as "carImage")
    formData.append("carImage", await shrinkImage(imageFile));

    const res = await fetch("/api/insert-car", {
      method: "POST",
      body: formData // no headers! Browser sets correct boundary
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
        document.getElementById('supplierName').value = '';
        document.getElementById('supplierPhone').value = '';
        document.getElementById('supplierEmail').value = '';
        document.getElementById('supplierAddress').value = '';
        document.getElementById('vinNumber').value = '';
        document.getElementById('purchaseDate').value = '';
        document.getElementById('purchasePrice').value = '';
        document.getElementById('costPrice').value = '';
        document.getElementById('Make').value = selectedMake;
        document.getElementById('model').value = selectedModel;
        document.getElementById('year').value = selectYear;
        document.getElementById('part-label').value = selectedParts;
        document.getElementById('condition').value = '';
        document.getElementById('sellingPrice').value = '';
        document.getElementById('status').value = '';
        document.getElementById('inventoryStock').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('imagePath').value = '';



    } else {
      alert("Insert failed: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Error submitting form:", err);
    alert("An error occurred. Please check console.");
  }
};

  

  

  return (
<form onSubmit={Submited} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', maxWidth: 600, margin: 'auto' }}>

{/* Supplier Info */}
<TextField id="supplierName" label="Supplier Name" variant="outlined" required />
<TextField id="supplierPhone" label="Supplier Phone" variant="outlined" required />
<TextField id="supplierEmail" label="Supplier Email" variant="outlined" required />
<TextField id="supplierAddress" label="Supplier Address" variant="outlined" required />

{/* Vehicle Info */}
<TextField
  id="make"
  select label="Make" value={selectedMake}
  onChange={(e) => {
    setSelectedMake(e.target.value);
    setSelectedModel('');
  }}
  required
>
  <MenuItem value="">Choose Make</MenuItem>
  {carCompanies.map((make, i) => (
    <MenuItem key={i} value={make}>{make}</MenuItem>
  ))}
</TextField>

<TextField
  id="model"
  select label="Model" value={selectedModel}
  onChange={(e) => setSelectedModel(e.target.value)}
  disabled={!selectedMake}
  required
>
  <MenuItem value="">Choose Model</MenuItem>
  {getModelsForMake(selectedMake).map((model, i) => (
    <MenuItem key={i} value={model}>{model}</MenuItem>
  ))}
</TextField>

<TextField
  id="year"
  select label="Year" value={selectYear}
  onChange={(e) => setSelectYear(e.target.value)}
  required
>
  <MenuItem value="">Choose Year</MenuItem>
  {years.map((year) => (
    <MenuItem key={year} value={year}>{year}</MenuItem>
  ))}
</TextField>

<TextField id="vinNumber" label="Car VIN Number" variant="outlined" required />
<TextField id="purchaseDate" label="Purchase Date" type="datetime-local" InputLabelProps={{ shrink: true }} required />
<TextField id="purchasePrice" label="Purchase Price" variant="outlined" required />

{/* Parts Selector */}
<InputLabel id="part-label">Select Parts</InputLabel>
<Select
  labelId="part-label"
  multiple
  value={selectedParts}
  onChange={handlePartChange}
  renderValue={(selected) => selected.join(', ')}
  required
>
  {partNames.map((name) => (
    <MenuItem key={name} value={name}>
      <Checkbox checked={selectedParts.includes(name)} />
      <ListItemText primary={name} />
    </MenuItem>
  ))}
</Select>

{/* Additional Part Info */}
<TextField
  id="condition"
  select label="Condition" value={condition}
  onChange={(e) => setCondition(e.target.value)}
  required
>
  <MenuItem value="">Select Condition</MenuItem>
  <MenuItem value="Good">Good</MenuItem>
  <MenuItem value="Average">Average</MenuItem>
  <MenuItem value="Bad">Bad</MenuItem>
</TextField>

<TextField id="costPrice" label="Cost Price" variant="outlined" required />

<TextField
  id="sellingPrice"
  label="Selling Price (comma-separated)"
  variant="outlined"
  value={sellingPrice}
  onChange={(e) => setSellingPrice(e.target.value)}
  helperText="Enter prices separated by commas (e.g. 100,200,300)"
  required
/>

<TextField
  id="status"
  select label="Status" value={status}
  onChange={(e) => setStatus(e.target.value)}
  required
>
  <MenuItem value="">Select Status</MenuItem>
  <MenuItem value="Available">Available</MenuItem>
  <MenuItem value="Sold">Sold</MenuItem>
</TextField>

<TextField
  id="quantity"
  label="Quantity" type="number"
  value={quantity} onChange={(e) => setQuantity(e.target.value)}
  required
/>

<TextField
  id="inventoryStock"
  select label="Inventory Stock" value={inventoryStock}
  onChange={(e) => setInventoryStock(e.target.value)}
  required
>
  <MenuItem value="">Select Inventory Status</MenuItem>
  <MenuItem value="In Stock">In Stock</MenuItem>
  <MenuItem value="Sold Out">Sold Out</MenuItem>
</TextField>

<input id='imagePath' type="file" required />

<Button type="submit" variant="contained" color="primary">
  Submit
</Button>
</form>

  );
}

export default Insertion_form;

//make the form insertation in db function created not working 