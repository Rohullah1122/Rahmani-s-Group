import React, { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import '../style/suppilerstbl.css';

function Supplierstbl() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/suppliers-with-vehicle-count') 
      .then(res => res.json())
      .then(data => {
        // If backend sends { recordset: [...] }
        if (data.recordset) {
          setSuppliers(data.recordset);
        } else {
          setSuppliers(data);
        }
      })
      .catch(err => console.error('Error fetching suppliers:', err));
  }, []);
  

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  console.log(suppliers);

  return (
    <div className='divmain'>
      <div className='divsearch'>
        <TextField
          placeholder="Search Supplier"
          variant="standard"
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </div>

      <div className='tbl'>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="supplier table">
            <TableHead>
              <TableRow>
                <TableCell>Supplier ID</TableCell>
                <TableCell>Supplier Name</TableCell>
                <TableCell align="right">Total Vehicles Supplied</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map((row) => (
                <TableRow key={row.supplier_id}>
                  <TableCell>{row.supplier_id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  {/* <TableCell>{row.total_vehicles}</TableCell> */}
                  <TableCell align="right">{row.total_vehicles}</TableCell>
                </TableRow>
              ))}
              {filteredSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">No suppliers found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}

export default Supplierstbl;
