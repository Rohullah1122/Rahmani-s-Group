import React, { useEffect, useState } from 'react';
import '../style/Vehicals.css';
import Button from '@mui/material/Button';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { fileUrl } from "../../utils/files";

function Vehicals() {
    const [vehicals, setVehicals] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCar, setSelectedCar] = useState(null); // <-- Added
    const [open, setOpen] = useState(false); // <-- Added

    function moreinfoclick(car_id){
        const car = vehicals.find(c => c.car_id === car_id);
        setSelectedCar(car);
        setOpen(true);
    }

    useEffect(() => {
        fetch('/api/vehicals')
            .then(res => res.json())
            .then(data => {
                if (data.recordset) {
                    setVehicals(data.recordset);
                } else {
                    setVehicals(data);
                }
            })
            .catch(err => console.error('Error fetching vehicals:', err));
    }, []);

    const filteredVehicals = vehicals.filter(v => 
        (v.model || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="vehicals-container">
            <div className="search-wrapper">
                <input
                    type="text"
                    placeholder="Search by make"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-box"
                />
            </div>

            <div className="cards-grid">
                {filteredVehicals.map(cars => (
                    <div key={cars.car_id} className="card">
                        <img src={fileUrl(cars.image_path)} className="card-img-top" alt={cars.make} />
                        <div className="card-body">
                            <h5 className="card-title">{cars.make}</h5>
                            <p className="card-text">{cars.model}</p>
                            <Button onClick={() => moreinfoclick(cars.car_id)} variant="outlined">More Info</Button>
                        </div>
                    </div>
                ))}
            </div>

   <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
  <DialogTitle>View Car Details</DialogTitle>
  <DialogContent dividers>
    {selectedCar && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Car image at the top */}
        {selectedCar.image_path && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={fileUrl(selectedCar.image_path)}
              alt={selectedCar.make}
              style={{ maxWidth: '350px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
            />
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {Object.entries(selectedCar).map(([key, value]) => (
            key !== 'image_path' && (  // exclude image_path from fields
              <TextField
                key={key}
                label={key.replace(/_/g, ' ')}
                value={value || ''}
                fullWidth
                size="small"
              />
            )
          ))}
        </div>
      </div>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)} variant="contained" color="primary">Close</Button>
  </DialogActions>
</Dialog>

      
        </div>
    );
}

export default Vehicals;
