// src/components/Inventory.jsx

import React, { useState } from 'react';
import '../styles/inventory.css';
import axios from 'axios';
import { useEffect } from 'react';
import { fileUrl } from "../../utils/files";
function Inventory({ carCompanies, carModels, vehicles }) {
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);


useEffect(() => {
  axios.get("/api/vehicals") // check spelling
    .then(response => {
      const results = response.data;
      const cleanResults = results.recordset || results;
      setAllVehicles(cleanResults);
      setSearchResults(cleanResults); // show all initially
    })
    .catch(err => console.error("Error fetching Vehicles:", err));
}, []);

const handleSearch = () => {
  const results = allVehicles.filter(car =>
    car.make === selectedMake && (!selectedModel || car.model === selectedModel)
  );
  setSearchResults(results);
};





  const getModelsForMake = (make) => {

    const found = carModels.find(c => c.make === make);
    return found ? found.models : [];

  };

  

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <span>Rahmani's</span>
        </div>
        <ul className="nav-links">
          <li><a href="/#">Main Page</a></li>
          <li><a href="/inventory">Inventory</a></li>
          <li><a href="/sellCar">Sell My Car</a></li>
          <li><a href="/contact">Contact us</a></li>
        </ul>
      </nav>

      <div className="container mt-4">
        <div className="form-inline">
          {/* Make Dropdown */}
          <select
            className="form-control mr-3"
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value);
              setSelectedModel('');
            }}
          >
            <option value="">Choose Make</option>
            {carCompanies.map((make, i) => (
              <option key={i} value={make}>{make}</option>
            ))}
          </select>

          {/* Model Dropdown */}
          <select
            className="form-control mr-3"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!selectedMake}
          >
            <option value="">Model</option>
            {getModelsForMake(selectedMake).map((model, i) => (
              <option key={i} value={model}>{model}</option>
            ))}
          </select>

          {/* Search Button */}
          <button className="btn btn-outline-secondary" onClick={handleSearch}>
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="container mt-5">
        <div className="row">
          {searchResults.length === 0 ? (
            <div className="col-12 text-center">
              <p>No results yet. Please search.</p>
            </div>
          ) : (
            searchResults.map((car, index) => (
              <div className="col-md-4 mb-4" key={index}>
                <div className="card">
                  <img src={fileUrl(car.image_path)} className="card-img-top" alt={car.model} />
                  <div className="card-body">
                    <h5 className="card-title">{car.make} - {car.model}</h5>
                    <p className="card-text">{car.Description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Inventory;


//search result is not working