import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pagesell.css";
import { carModels, carCompanies, vehicleYears } from "../../utils/Vehicle_info";
import axios from "axios";
import { shrinkImage } from "../../utils/files";

function SellCar() {
  const navigate = useNavigate();

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    Email : "",
    make: "",
    model: "",
    year: "",
    photos: [],
  });

  const [errors, setErrors] = useState({});
  const { name, phone, location, Email,make, model, year, photos } = formData;

  // --- Handle Change (for text inputs) ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    let error = "";

    // ---- Phone validation ----
    if (id === "phone") {
      const phoneRegex =
        /^(\+1\s?)?(\([2-9][0-9]{2}\)|[2-9][0-9]{2})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

      if (!value) {
        error = "Please enter a phone number";
  
      } else if (value.replace(/\D/g, "").length < 10) {
        error = "Phone number must be at least 10 digits";
      } else if (!phoneRegex.test(value)) {
        error =
          "Invalid Canadian phone number (e.g. 403-555-1234, (403) 555-1234, +1 403 555 1234)";
      }
    }

    // ---- Update form data ----
    setFormData((prev) => ({ ...prev, [id]: value }));

    // ---- Update errors ----
    setErrors((prev) => ({ ...prev, [id]: error }));
  };

  // --- Handle Dropdowns ---
  const handleMakeChange = (e) => {
    setFormData({ ...formData, make: e.target.value, model: "" });
  };

  const handleModelChange = (e) => {
    setFormData({ ...formData, model: e.target.value });
  };

  const handleYearChange = (e) => {
    setFormData({ ...formData, year: e.target.value });
  };

  // --- Handle File Upload ---
  const handleFileChange = (e) => {
    setFormData({ ...formData, photos: Array.from(e.target.files) });
  };

  // --- Handle Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Require minimum photos
    if (photos.length < 4) {
      alert("Please upload at least 4 photos (front, back, left, right).");
      return;
    }

     // Check for validation errors before submitting
  if (errors.phone) {
    alert("Please fix the phone number before submitting.");
    return;
  }

    const data = new FormData();
    data.append("name", name);
    data.append("phone", phone);
    data.append("Email",Email);
    data.append("location", location);
    data.append("make", make);
    data.append("model", model);
    data.append("year", year);
    // make each photo smaller first, so the upload stays fast and under the size limit
    for (const file of photos) data.append("photos", await shrinkImage(file));

    try {
      const res = await axios.post("/api/insersellcar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      

  alert("Response: " + JSON.stringify(res.data));


 
       navigate(0);
    
    
    } catch (err) {
      console.error("❌ Error uploading data:", err);
      alert("Error uploading your data, please try again later." + err);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="nav-logo">
          <span>Rahmani's</span>
        </div>
        <ul className="navbar-nav ml-auto">
          <li className="nav-item">
            <a className="nav-link" href="/#">
              Main Page
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/inventory">
              Inventory
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/sellCar">
              Sell My Car
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="/contact">
              Contact us
            </a>
          </li>
        </ul>
      </nav>

      {/* Form */}
      <div className="container mt-5">
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-3">
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <input
              type="tel"
              className="form-control"
              id="phone"
              value={phone}
              onChange={handleChange}
              required
              pattern="^ /^(\+1\s?)?(\([2-9][0-9]{2}\)|[2-9][0-9]{2})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;"
              title="Please enter a valid phone number (e.g. 123-456-7890)"
            />
            {errors.phone && <small className="text-danger">{errors.phone}</small>}
          </div>


          {/* Email */}
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="Email"
              value={Email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Location */}
          <div className="mb-3">
            <label htmlFor="location" className="form-label">
              Location
            </label>
            <input
              type="text"
              className="form-control"
              id="location"
              value={location}
              onChange={handleChange}
              required
              pattern="^\d+\s+[A-Za-z0-9\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*[A-Z]\d[A-Z]\s?\d[A-Z]\d$"
              title="Please enter a valid Canadian address (e.g. 123 Main St, Toronto, ON M5V 3L9)"
            />
          </div>

          {/* Vehicle Specification */}
          <div className="mb-3">
            <label className="form-label">Vehicle Specification</label>
            <div className="d-flex flex-wrap">
              <select
                className="form-control mr-3"
                value={make}
                onChange={handleMakeChange}
                required
              >
                <option value="">Choose Make</option>
                {carCompanies.map((company, i) => (
                  <option key={i} value={company}>
                    {company}
                  </option>
                ))}
              </select>

              <select
                className="form-control mr-3"
                value={model}
                onChange={handleModelChange}
                required
                disabled={!make}
              >
                <option value="">Choose Model</option>
                {(carModels.find((c) => c.make === make)?.models || []).map(
                  (m, i) => (
                    <option key={i} value={m}>
                      {m}
                    </option>
                  )
                )}
              </select>

              <select
                className="form-control mr-3"
                value={year}
                onChange={handleYearChange}
                required
              >
                <option value="">Choose Year</option>
                {vehicleYears.map((y, i) => (
                  <option key={i} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-3">
            <label htmlFor="photos" className="form-label">
              Attach Photos
            </label>
            <input
              type="file"
              className="form-control"
              id="photos"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>

          {/* Photos validation / preview */}
          {photos.length < 4 ? (
            <div className="mb-3 text-danger">
              <p>Please upload at least 4 photos (front, back, left, right).</p>
            </div>
          ) : (
            <div className="mb-3">
              <p>Selected Photos:</p>
              <ul>
                {photos.map((file, i) => (
                  <li key={i}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={photos.length < 4}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default SellCar;
