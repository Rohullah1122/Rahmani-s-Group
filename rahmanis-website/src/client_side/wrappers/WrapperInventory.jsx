// src/components/WrapperInventory.jsx

import React from 'react';
import Inventory from '../Layouts/Inventory'; 

function WrapperInventory() {
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



  return (
    <Inventory carCompanies={carCompanies} carModels={carModels} />
  );
}

export default WrapperInventory;
