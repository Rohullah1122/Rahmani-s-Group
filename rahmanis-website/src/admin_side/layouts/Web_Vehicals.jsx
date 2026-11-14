import React, { useState, useEffect } from "react";
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InfoIcon from "@mui/icons-material/Info";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../style/Web_Vehicals.css";
import { fileUrl } from "../../utils/files";

function Web_Vehicals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [Vehicals, setVehicals] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [allVehicles, setAllVehicles] = useState([]);

  const navigate = useNavigate();

//   useEffect(() => {
//     const fetchVehicles = async () => {
//       try {
//         const res = await axios.get("/api/selectwebcars");
//         const parsed = res.data.map((v) => ({
//           ...v,
//           photos: v.photos ? JSON.parse(v.photos).map((p) => p.replace(/\\/g, "/")) : [],
//         }));
//         setVehicals(parsed);
//         setAllVehicles(parsed);

//       } catch (error) {
//         console.error("Server error", error);
//         alert("Server error: " + error);
//       }
//     };
//     fetchVehicles();
//   }, []);

  useEffect(() =>{

    fetchVehicles();

  },[]);

  const fetchVehicles = async () => {
  try {
    const res = await axios.get("/api/selectwebcars");
    const parsed = res.data.map((v) => ({
      ...v,
      photos: v.photos ? JSON.parse(v.photos).map((p) => p.replace(/\\/g, "/")) : [],
    }));
    setVehicals(parsed);
    setAllVehicles(parsed);
  } catch (error) {
    console.error("Server error", error);
    alert("Server error: " + error);
  }
};



  const handlepurchase = (car) => {
    navigate("/insertationform", { state: { car } });
  };

const OnSearchclick = (e) => {
  const value = e.target.value.toLowerCase();
  setSearchTerm(value);

  if (value === "") {
    setVehicals(allVehicles); // restore full list
    return;
  }

  const filtered = allVehicles.filter((V) => {
    const model = V.model?.toLowerCase() || "";
    const make = V.make?.toLowerCase() || "";
    const location = V.location?.toLowerCase() || "";
    return (
      model.includes(value) ||
      make.includes(value) ||
      location.includes(value)
    );
  });

  setVehicals(filtered);
};

  const handleOpenDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpen(true);
  };

  const handleCloseDialog = () => {setOpen(false); };

const handleIgnore = async (vehicle) => {
  const car_id = vehicle.car_id;
  try {
    await axios.delete(`/api/web_vehcale_delete/${car_id}`);
    alert("✅ Vehicle deleted successfully!");
    await fetchVehicles(); // 🔄 refresh list after delete
  } catch (error) {
    console.error("❌ Delete error:", error);
    alert("Server error while deleting vehicle");
  }
};

  const handleNextPhoto = () => {
    if (selectedVehicle && selectedPhotoIndex < selectedVehicle.photos.length - 1) {
      const nextIndex = selectedPhotoIndex + 1;
      setSelectedPhotoIndex(nextIndex);
      setSelectedPhoto(fileUrl(selectedVehicle.photos[nextIndex]));
    }
  };

  const handlePrevPhoto = () => {
    if (selectedVehicle && selectedPhotoIndex > 0) {
      const prevIndex = selectedPhotoIndex - 1;
      setSelectedPhotoIndex(prevIndex);
      setSelectedPhoto(fileUrl(selectedVehicle.photos[prevIndex]));
    }
  };

  return (
    <div>
      {/* 🔍 Search bar */}
      <div className="searchdiv">
        <input
          type="text"
          className="textsearch"
          placeholder="Search vehicles..."
          onChange={OnSearchclick}
        />
        <IconButton color="primary">
          <SearchIcon />
        </IconButton>
      </div>

      {/* 🚗 Vehicle cards */}
      <div className="Cardive">
        {Vehicals.map((V, index) => (
          <Card key={index} className="vehicle-card">
            <CardMedia className="vehicle-image" image={fileUrl(V.photos[0])} />
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                {V.model}
              </Typography>
              <Typography variant="body2" className="vehicle-subtitle">
                {V.make} — {V.year}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<InfoIcon />}
                onClick={() => handleOpenDialog(V)}
              >
                More Info
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<RemoveCircleOutlineIcon />}
                onClick={() =>handleIgnore(V)}
              >
                Ignore
              </Button>
            </CardActions>
          </Card>
        ))}
      </div>

      {/* 🪟 Vehicle Info Dialog */}
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>Vehicle Details</DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <>
              {selectedVehicle.photos.map((photo, i) => (
                <img
                  key={i}
                  src={fileUrl(photo)}
                  alt={selectedVehicle.model}
                  className="dialog-image"
                  onClick={() => {
                    setSelectedPhotoIndex(i);
                    setSelectedPhoto(fileUrl(photo));
                  }}
                />
              ))}
              <Typography><strong>Owner:</strong> {selectedVehicle.seller_name}</Typography>
              <Typography><strong>Phone:</strong> {selectedVehicle.phone}</Typography>
              <Typography><strong>Location:</strong> {selectedVehicle.location}</Typography>
              <Typography><strong>Make:</strong> {selectedVehicle.make}</Typography>
              <Typography><strong>Model:</strong> {selectedVehicle.model}</Typography>
              <Typography><strong>Year:</strong> {selectedVehicle.year}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">Close</Button>
          <Button onClick={() => handlepurchase(selectedVehicle)} color="primary" variant="contained">
            Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🖼️ Full-size Image Dialog */}
      <Dialog open={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} maxWidth="md" fullWidth>
        <DialogContent className="full-image-dialog">
          {selectedPhoto && <img src={selectedPhoto} alt="Full-size" className="full-image" />}
          {selectedVehicle && selectedPhotoIndex > 0 && (
            <Button onClick={handlePrevPhoto} variant="contained" className="nav-button left">◀</Button>
          )}
          {selectedVehicle && selectedPhotoIndex < selectedVehicle.photos.length - 1 && (
            <Button onClick={handleNextPhoto} variant="contained" className="nav-button right">▶</Button>
          )}
        </DialogContent>
        <DialogActions className="full-image-close">
          <Button variant="contained" color="secondary" onClick={() => setSelectedPhoto(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Web_Vehicals;
