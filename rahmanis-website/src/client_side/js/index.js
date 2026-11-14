// SLIDER IMAGES ARRAY
const sliderImages = [
    "../assets/engine.jpeg",
    "../assets/engine2.jpg",
    "../assets/tires1.jpg",
    "../assets/tires2.jpg"
  ];
  




  let currentSlide = 0;
  const slideImg = document.getElementById("slide-img");
  
  // Preload all slider images once
  const preloadImages = (imageArray) => {
    imageArray.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  };
  
  preloadImages(sliderImages); // 👈 Preload just once
  
  // Function to cycle through slider images
  function updateSlider() {
    slideImg.src = sliderImages[currentSlide];
    currentSlide = (currentSlide + 1) % sliderImages.length;
  }
  
  setInterval(updateSlider, 3000); // 👈 This runs the image switch, not preload!
  

  const junkyardContent = [
    {
      title: "Welcome to Rahmani's Junkyard",
      description:
        "We turn your old metal into treasure. Whether you're looking for auto parts, scrap metal, or hidden gems, we've got you covered. Bring your junk — leave with value. We're your trusted source for car removals, vintage finds, and scrapping services.",
      image: "../assets/junkyard.jpg"
    },
    {
      title: "Explore Laval's Best Scrap Yard",
      description:
        "For over 20 years, we've been helping locals clear out clutter, find rare parts, and recycle responsibly. Stop by today and discover why we're Laval’s #1 junk destination.",
      image: "../assets/carpart1.webp"
    },
    {
      title: "Sell Your Car for Cash Today!",
      description:
        "We offer top dollar for unwanted vehicles — running or not. Fast, fair, and friendly service every time.",
      image: "../assets/sellingcar.png"
    }
  ];
  
  

  function cards() {
    const junkyardSection = document.getElementById('junkyard-section');
  
    // Start from index 1 to skip the first item (already in HTML)
    for (let i = 0; i < junkyardContent.length; i++) {
      const details = junkyardContent[i];
  
      // Container for each card
      const container = document.createElement('div');
      container.classList.add('junkyard-entry');
  
      // Text side
      const junktext = document.createElement('div');
      junktext.classList.add('junkyard-text');
  
      const h2 = document.createElement('h2');
      h2.textContent = details.title;
  
      const p = document.createElement('p');
      p.textContent = details.description;
  
      junktext.appendChild(h2);
      junktext.appendChild(p);
  
      // Image side
      const junkcard = document.createElement('div');
      junkcard.classList.add('junkyard-card');
  
      const img = document.createElement('img');
      img.src = details.image;
      img.alt = details.title;
  
      junkcard.appendChild(img);
  
      // Append to section
      container.appendChild(junktext);
      container.appendChild(junkcard);
  
      junkyardSection.appendChild(container);
    }
  }
  
  // Run after DOM loads
  cards();
  
  