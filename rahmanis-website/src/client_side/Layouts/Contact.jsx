import React, { useState } from "react";
import '../styles/contact.css';
import axios from "axios";

function Contact() {
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({

    Fullname : "",
    Email : "",
    Message : ""
 });


  const {Fullname,Email,Message} = formData;

  


  const Handlemsg = async (e)=>{
   e.preventDefault();
    const data = new FormData();
    data.append(Fullname,"contactname");
    data.append(Email,"contactEmail");
    data.append(Message,"contactMessage");

      if (!Fullname || !Email || !Message) {
      alert("Please fill in all fields!");
      return;
    }

    
    try{
      const res = await axios.post("/api/contactforminseration", {Fullname,Email,Message});
    alert("Message Received!");
    setFormData({ Fullname: "", Email: "", Message: "" });


      }catch(error){
        alert(error);
      }


  };

 // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    // Update state dynamically
    setFormData((prev) => ({
      ...prev,
      [id === "contactName" ? "Fullname" : id === "contactEmail" ? "Email" : "Message"]: value
    }));
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

      <section className="contact-section py-5" id="contact">
        <div className="container">
          <h2 className="text-center mb-4">Contact Us</h2>
          <div className="row">
            {/* Contact Info */}
            <div className="col-md-5 mb-4">
              <div className="contact-info bg-light p-4 rounded shadow">
                <h4 className="mb-3">Get in Touch</h4>
                <p><i className="fas fa-map-marker-alt mr-2"></i> Rahmani's Junkyard Quebec, Canada</p>
                <p><i className="fas fa-phone-alt mr-2"></i> (123) 456-7890</p>
                <p><i className="fas fa-envelope mr-2"></i> Rahmani's@gmail.com</p>
                <div className="mt-3">
                  <a href="#" className="text-dark mr-3"><i className="fab fa-facebook fa-lg"></i></a>
                  <a href="#" className="text-dark mr-3"><i className="fab fa-instagram fa-lg"></i></a>
                  <a href="#" className="text-dark"><i className="fab fa-twitter fa-lg"></i></a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="col-md-7">
              <form className="bg-white p-4 rounded shadow">
                <div className="form-group">
                  <label htmlFor="contactName">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="contactName"
                    placeholder="Your name"
                     onChange={handleChange}
                     value = {Fullname}
                     required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactEmail">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="contactEmail"
                    placeholder="Enter email"
                    value={Email}
                     onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactMessage">Message</label>
                  <textarea
                    className="form-control"
                    id="contactMessage"
                    value={Message}
                    rows="4"
                    placeholder="How can we help you?"
                     onChange={handleChange}
                  />
                </div>
                <button type="submit" className="btn btn-dark" onClick={Handlemsg}>Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );

}

export default Contact;
