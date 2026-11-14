import React, { useState, useEffect } from 'react';
import '../styles/index.css';

// Example props passed from wrapper
function MainPage(props) {
  // Slider images array coming from props or define here
  const sliderImages = props.sliderImages;

  // Junkyard cards data array coming from props or define here
  const junkyardContent = props.junkyardContent;

  // State for current slider image index
  const [currentSlide, setCurrentSlide] = useState(0);

  // useEffect to cycle slider images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % sliderImages.length);
    }, 3000);
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-logo">
          <span>Rahmani's</span>
        </div>
        <ul className="nav-links">
          <li><a href="/#">Main Page</a></li>
          <li><a href="/inventory">Inventory</a></li>
          <li><a href="/SellCar">Sell My Car</a></li>
          <li><a href="/contact">Contact us</a></li>
        </ul>
      </nav>

      <div className="main_div">
        <div className="slider">
          <img
            id="slide-img"
            src={sliderImages[currentSlide]}
            alt={`Slide ${currentSlide + 1}`}
            
          />
         { console.log('sliderImages:', sliderImages)}

        </div>

        <div className="text">
          <h1>Rahmani's Junkyard</h1>
          <p>
            Located in the heart of Laval, Rahmani's Junkyard has been a trusted name in automotive recycling and metal salvage for over 20 years. 
            We pride ourselves on giving new life to old parts and serving the community with reliable service and unbeatable prices. 
            Whether you're buying, selling, or scrapping — we have got your back.
          </p>
        </div>

        {junkyardContent.map((item, index) => (
  <div className="junkyard-section" key={index}>
          <h2>{item.title}</h2>
    <div className="junkyard-entry">
      <div className="junkyard-text">
        <p>{item.description}</p>
      </div>
      <div className="junkyard-card">
        <img src={item.image} alt={item.title} />
      </div>
    </div>
  </div>
))}

      </div>
    </>
  );
}

export default MainPage;
