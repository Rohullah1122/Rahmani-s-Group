const carCompanies = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "Hyundai",
  "Kia",
  "Mazda",
  "Subaru",
  "Volkswagen",
  "Dodge",
  "Ram",
  "Chrysler",
  "GMC",
  "Buick",
  "Jeep"
];

const carModels = [
  { make: "Toyota", models: ["Camry", "Corolla", "RAV4", "Highlander", "Prius"] },
  { make: "Honda", models: ["Civic", "Accord", "CR-V", "Pilot", "Fit"] },
  { make: "Ford", models: ["F-150", "Mustang", "Escape", "Explorer", "Fusion"] },
  { make: "Chevrolet", models: ["Silverado", "Malibu", "Equinox", "Camaro", "Traverse"] },
  { make: "Nissan", models: ["Altima", "Rogue", "Sentra", "Pathfinder", "Murano"] },
  { make: "BMW", models: ["3 Series", "5 Series", "X3", "X5", "M3"] },
  { make: "Mercedes-Benz", models: ["C-Class", "E-Class", "GLC", "GLE", "S-Class"] },
  { make: "Volkswagen", models: ["Golf", "Passat", "Tiguan", "Jetta", "Atlas"] },
  { make: "Audi", models: ["A3", "A4", "Q5", "Q7", "A6"] },
  { make: "Hyundai", models: ["Elantra", "Sonata", "Tucson", "Santa Fe", "Kona"] },
  { make: "Kia", models: ["Soul", "Sportage", "Sorento", "Optima", "Telluride"] },
  { make: "Subaru", models: ["Outback", "Forester", "Impreza", "Crosstrek", "WRX"] },
  { make: "Mazda", models: ["Mazda3", "Mazda6", "CX-5", "CX-9", "MX-5 Miata"] },
  { make: "Lexus", models: ["RX", "NX", "ES", "IS", "GX"] },
  { make: "Jeep", models: ["Wrangler", "Cherokee", "Grand Cherokee", "Compass", "Renegade"] },
  { make: "Dodge", models: ["Charger", "Challenger", "Durango", "Journey", "Ram 1500"] },
  { make: "Tesla", models: ["Model S", "Model 3", "Model X", "Model Y"] },
  { make: "Porsche", models: ["911", "Cayenne", "Macan", "Panamera", "Taycan"] },
  { make: "Infiniti", models: ["Q50", "QX60", "QX80", "QX50", "Q70"] },
  { make: "Acura", models: ["ILX", "TLX", "RDX", "MDX", "NSX"] }
];

let vehicals = [

  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},
  {make : "Toyota",model : "RAV4",Description:"this was brought on 17 april most of parts are thier",image :"../assets/rav4.jpg"},


  ]




let dropdownBtnMake = document.getElementById('btndropdownmake');
let ulMakes = document.getElementById('ulmakes');
let dropdownBtnModel = document.getElementById('btndropdownmodel');
let ulModels = document.getElementById('ulmodels');
let btnsearch = document.getElementById('btnsearch');

let isMakeListLoaded = false;

dropdownBtnMake.addEventListener('click', function () {
  if (!isMakeListLoaded) {
    carCompanies.forEach(make => {
      let li = document.createElement('li');
      let a = document.createElement('a');
      a.textContent = make;
      a.href = "#";
      a.classList.add('dropdown-item');

      li.appendChild(a);
      ulMakes.appendChild(li);

      a.addEventListener('click', function () {
        dropdownBtnMake.textContent = a.textContent;
        dropdownBtnModel.textContent = "Model"; 
        ulModels.innerHTML = ""; 
      });
    });

    isMakeListLoaded = true;
  }
});

dropdownBtnModel.addEventListener('click', function () {
  let selectedMake = dropdownBtnMake.textContent;


  ulModels.innerHTML = "";


  const selectedData = carModels.find(car => car.make === selectedMake);

  if (selectedData) {
    selectedData.models.forEach(model => {
      let li = document.createElement('li');
      let a = document.createElement('a');
      a.textContent = model;
      a.href = "#";
      a.classList.add('dropdown-item');

      li.appendChild(a);
      ulModels.appendChild(li);

      a.addEventListener('click', function () {
        dropdownBtnModel.textContent = a.textContent;
      });
    });
  }
});



btnsearch.addEventListener('click', function () {
  let row = document.getElementById('resultsRow'); // Only target the row
  row.innerHTML = ""; // Clear previous cards

  let make = dropdownBtnMake.textContent.trim();
  let model = dropdownBtnModel.textContent.trim();

  console.log("Searching for: ", make, model);

  const results = vehicals.filter(car =>
    car.make === make && (model === "All" || car.model === model)
  );

  if (results.length === 0) {
    row.innerHTML = "<p class='text-center w-100'>No results found.</p>";
    return;
  }

  results.forEach(car => {
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";

    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card-img-top";
    img.src = car.image;
    img.alt = car.model;

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = `${car.make} - ${car.model}`;

    const desc = document.createElement("p");
    desc.className = "card-text";
    desc.textContent = car.Description;

    cardBody.appendChild(title);
    cardBody.appendChild(desc);
    card.appendChild(img);
    card.appendChild(cardBody);
    col.appendChild(card);
    row.appendChild(col);
  });
});






// I need to work on front side and passport for backend admin side