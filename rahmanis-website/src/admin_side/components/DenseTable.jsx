import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableContainer, TableHead,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField
} from '@mui/material';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import '../style/Tblcarinfo.css';
import { fileUrl } from "../../utils/files";


const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

function DenseTable() {
  const [carData, setCarData] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const fetchCarData = () => {
    fetch('/api/car-details')
      .then(res => res.json())
      .then(data => {
        setCarData(data);
        setFilteredData(data);
      })
      .catch(err => console.error('Fetch error:', err));
  };
  
  useEffect(() => {
    fetchCarData();
  }, []);
  


  const handleSearch = () => {
    const query = searchQuery.toLowerCase().trim();
    const results = carData.filter(item =>
      item.make?.toLowerCase().startsWith(query) ||
      item.model?.toLowerCase().startsWith(query)
    );
    setFilteredData(results);
  };
  
  
  

  const handleRowDoubleClick = (row) => {
    setSelectedRow({ ...row });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRow(null);
  };

  const handleChange = (e) => {
    setSelectedRow({
      ...selectedRow,
      [e.target.name]: e.target.value,
    });
  };
 const handleUpdate = () => {
    console.log('Updating with data:', selectedRow); // Debug log
    fetch(`/api/car-details/${selectedRow.car_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectedRow),
    })
      .then(res => res.json())
      .then(() => {
        setCarData(data => data.map(item =>
          item.car_id === selectedRow.car_id ? selectedRow : item
        ));
        fetchCarData(); // refresh data
        handleClose();
      })
      .catch(err => console.error('Update error:', err));


  };

  const deleteCar = async (carId,part_id) => {
    try {
      const res = await fetch(`/api/car-details/${carId}/${part_id}`, {
        method: 'DELETE',
      });

 
      

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      console.log('Car deleted:', data.message);

      setCarData(prev => prev.filter(item => item.car_id !== carId));
      fetchCarData(); // refresh data
      handleClose();
    } catch (err) {
      console.error('Error deleting car:', err);
    }
  };

  return (
    <div className='divetblbody'>
 <div className="search-bar">
  <TextField
    label="Search by Car Make or Model"
    variant="outlined"
    size="small"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="search-input"
  />
  <Button variant="contained" onClick={handleSearch} className="search-button">Search</Button>
</div>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 1000 }} size="small">
          <TableHead>
            <StyledTableRow>
              <StyledTableCell>Make</StyledTableCell>
              <StyledTableCell>Model</StyledTableCell>
              <StyledTableCell>VIN</StyledTableCell>
              <StyledTableCell>Purchase Price</StyledTableCell>
              <StyledTableCell>Purchase Date</StyledTableCell>
              <StyledTableCell>Car Cost Price</StyledTableCell>
              <StyledTableCell>Supplier Name</StyledTableCell>
              <StyledTableCell>Supplier Phone</StyledTableCell>
              <StyledTableCell>Supplier Address</StyledTableCell>
              <StyledTableCell>Part Name</StyledTableCell>
              <StyledTableCell>Part Condition</StyledTableCell>
              <StyledTableCell>Part Cost Price</StyledTableCell>
              <StyledTableCell>Part Selling Price</StyledTableCell>
              <StyledTableCell>Part Status</StyledTableCell>
              <StyledTableCell>Inventory Quantity</StyledTableCell>
              <StyledTableCell>Inventory Status</StyledTableCell>
                 <StyledTableCell>Vehicale image</StyledTableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
          {filteredData.map((row, index) => (
        <StyledTableRow key={`${row.car_id}-${index}`} onDoubleClick={() => handleRowDoubleClick(row)}>
                <StyledTableCell>{row.make}</StyledTableCell>
                <StyledTableCell>{row.model}</StyledTableCell>
                <StyledTableCell>{row.vin_number}</StyledTableCell>
                <StyledTableCell>{row.purchase_price}</StyledTableCell>
                <StyledTableCell>{new Date(row.purchase_date).toLocaleDateString()}</StyledTableCell>
                <StyledTableCell>{row.car_cost_price}</StyledTableCell>
                <StyledTableCell>{row.supplier_name}</StyledTableCell>
                <StyledTableCell>{row.supplier_phone}</StyledTableCell>
                <StyledTableCell>{row.supplier_address}</StyledTableCell>
                <StyledTableCell>{row.part_name || '—'}</StyledTableCell>
                <StyledTableCell>{row.part_condition || '—'}</StyledTableCell>
                <StyledTableCell>{row.part_cost_price || '—'}</StyledTableCell>
                <StyledTableCell>{row.part_selling_price || '—'}</StyledTableCell>
                <StyledTableCell>{row.part_status || '—'}</StyledTableCell>
                <StyledTableCell>{row.inventory_quantity || '—'}</StyledTableCell>
                <StyledTableCell>{row.inventory_status || '—'}</StyledTableCell>
             <StyledTableCell>{row.image_path && (<img src={fileUrl(row.image_path)}  alt="Car" style={{ width: "100px", height: "auto", borderRadius: "8px" }}/>)}</StyledTableCell>


              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Record</DialogTitle>
        <DialogContent dividers>
          {selectedRow && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {Object.entries(selectedRow).map(([key, value]) => (
          key !== 'id' && key !== 'part_id' && (  // exclude part_id from visible inputs
            <TextField
              key={`field-${key}`}
              name={key}
              label={key}
              value={value || ''}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          )
))}

            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUpdate} variant="contained" color="primary">Update</Button>
          <Button onClick={() => deleteCar(selectedRow.car_id,selectedRow.part_id)} variant="contained" color="error">Delete</Button>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DenseTable;


