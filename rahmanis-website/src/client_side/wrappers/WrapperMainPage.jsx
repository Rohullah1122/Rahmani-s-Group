import React from 'react';
import MainPage from '../Layouts/MainPage';

// Make sure your image imports or URLs are correct for React
import engine from '../../assets/engine.jpeg';
import tires1 from '../../assets/tires1.jpg';
import tires2 from '../../assets/tires2.jpg';
import sellcarImg from '../../assets/sellingcar.png'

function WrapperMainPage() {
  const sliderImages = [engine, sellcarImg];

  const junkyardContent = [
    {
      title: "Welcome to Rahmani's Junkyard",
      description:
        "We turn your old metal into treasure. At Rahmani's Junkyard, we believe every vehicle and metal part has a story—and a second life. From rusted-out sedans to vintage classics, we salvage, recycle, and repurpose with precision and care. Our team of experts can help you find the perfect part or guide you through selling your vehicle for top dollar. Come visit us and discover how your so-called junk can be turned into real value.",
      image: engine
    },
    {
      title: "Explore Laval's Best Scrap Yard",
      description:
        "For over 20 years, Rahmani's Junkyard has served the Laval community with honesty, integrity, and unbeatable service. We specialize in dismantling, recycling, and reselling parts from thousands of vehicles, ensuring that nothing goes to waste. Whether you're a mechanic looking for rare components or a car owner cleaning out your garage, our massive inventory and knowledgeable staff are here to help. Stop by today and see why we’re considered the best in the business.",
      image: tires1
    },
    {
      title: "Sell Your Car for Cash Today!",
      description:
        "Ready to get rid of your old car? We make it easy. At Rahmani's Junkyard, we offer fast and fair cash deals for vehicles in any condition — running, broken, or completely wrecked. Our hassle-free process includes free towing, instant quotes, and same-day payment. No paperwork headaches, no lowball offers. Just honest service and real value for your vehicle. Contact us now to turn your unwanted car into cash — today.",
      image: tires2
    }
  ];
  
  

  return (
    <MainPage sliderImages={sliderImages} junkyardContent={junkyardContent} />
  );
}

export default WrapperMainPage;
