import express from 'express';
import sql from 'mssql';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcrypt';
import { stat } from 'fs';
import  session  from 'express-session';
import passport from "passport";
import cors from "cors";
import { request } from 'http';


// Load environment variables
dotenv.config({ path: './server.env' }); // adjust path if needed

// Initialize app
const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const saltRounds = 10;

// DB config
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: 'localhost',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};



const allowedOrigins = ["http://localhost:3000", "https://myfrontend.com"];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, origin);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// }));

app.use(cors({
  origin: "http://localhost:3000",  // React frontend
  credentials: true,                // Allow cookies/auth headers
}));








export { app, upload, dbConfig };


// app.set('trust proxy', 1);


app.use(
  session({
    secret: process.env.SECRET,     // change to a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,  // ❌ set true only if using HTTPS
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);




app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.admin_id);  // store only the user ID in session
});

passport.deserializeUser(async (id, done) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM admin_users WHERE admin_id = @id');
    done(null, result.recordset[0]); // attach user to req.user
  } catch (err) {
    done(err, null);
  }
});





app.get("/api/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
        console.log(req.isAuthenticated +"This is authentication");
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});


function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(req.isAuthenticated +"This is authentication");
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}


app.get("/Mainpage",(req, res) => {
  if (req.isAuthenticated()) {
  res.redirect('/Mainpage'); 
  } else {
    res.redirect("/login");
  }
});



app.get('/api/Mainpage',(req,res) =>{

    res.redirect("/Mainpage");

})




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.post('/api/login', async (req, res) => {
  const { adminName, adminPassword } = req.body;

  if (!adminName || !adminPassword) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request()
      .input('username', sql.NVarChar, adminName.toLowerCase())
      .query('SELECT * FROM admin_users WHERE LOWER(username) = @username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid username' });
    }
    

    const user = result.recordset[0];
    const isMatch = await bcrypt.compare(adminPassword, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // ✅ login and set session
    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Login failed' });
      req.session.isAuthenticated = true;
      req.session.user = { id: user.admin_id, username: user.username };
      res.json({ success: true });
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});





app.get('/api/parts',async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request().query('SELECT * FROM parts');
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching parts');
  }
});






// Send email route
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour

  try {
    let pool = await sql.connect(dbConfig);

    // 🔐 First, check if the email exists in admin_users
    const userResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM admin_users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // ✅ Email exists, insert the token into password_resets
    await pool.request()
      .input('email', sql.NVarChar, email)
      .input('token', sql.NVarChar, token)
      .input('expires', sql.DateTime, expires)
      .query(`
        INSERT INTO password_resets (email, token, expires_at)
        VALUES (@email, @token, @expires)
      `);

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset',
      html: `<p>Click below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`
    });

    res.json({ message: 'Password reset link sent!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.post('/api/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }

  try {
    let pool = await sql.connect(dbConfig);

    // Check if token is valid and not expired
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`SELECT * FROM password_resets WHERE token = @token AND expires_at > GETDATE()`);

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const userEmail = result.recordset[0].email;

    // Update the password in admin_users
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await pool.request()
      .input('email', sql.NVarChar, userEmail)
      .input('hashedPassword', sql.NVarChar, hashedPassword) // for now, plain — ideally hash it
      .query(`UPDATE admin_users SET password_hash = @hashedPassword WHERE email = @email`);
      console.log(hashedPassword);

    // Optionally, delete the token so it can’t be reused
    await pool.request()
      .input('token', sql.NVarChar, token)
      .query(`DELETE FROM password_resets WHERE token = @token`);

    res.json({ message: 'Password has been reset successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/api/sale', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT 
        FORMAT(s.sale_date, 'yyyy-MM') AS sale_month,
        SUM(s.price_sold) AS total_sales
      FROM sales s
      GROUP BY FORMAT(s.sale_date, 'yyyy-MM')
      ORDER BY sale_month
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching sales data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.post('/api/purchased', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        FORMAT(purchase_date, 'yyyy-MM-dd') AS purchase_date,
        SUM(purchase_price) AS total_purchase
      FROM cars
      GROUP BY FORMAT(purchase_date, 'yyyy-MM-dd')
      ORDER BY purchase_date;
    `);

    res.json(result.recordset);  // send data back in response
  } catch (err) {
    console.error('Error fetching purchase data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




app.post('/api/insert-car', upload.single("carImage"), async (req, res) => {
  const {
    supplierName,
    supplierPhone,
    supplierEmail,
    supplierAddress,
    make,
    model,
    year,
    vinNumber,
    purchaseDate,
    purchasePrice,
    condition,
    costPrice,
    sellingPrices,
    parts,
    status,
    quantity,
    inventoryStock
  } = req.body;

  // uploaded image file info
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Supplier insert (same as before)
    const supplierRequest = new sql.Request(transaction);
    const supplierResult = await supplierRequest
      .input('name', sql.NVarChar, supplierName)
      .input('phone', sql.NVarChar, supplierPhone)
      .input('email', sql.NVarChar, supplierEmail)
      .input('address', sql.NVarChar, supplierAddress)
      .query(`
        INSERT INTO suppliers (name, phone, email, address)
        OUTPUT INSERTED.supplier_id
        VALUES (@name, @phone, @email, @address)
      `);

    const supplierId = supplierResult.recordset[0].supplier_id;

    // Car insert WITH image_path
    const carRequest = new sql.Request(transaction);
    const carResult = await carRequest
      .input('make', sql.NVarChar, make)
      .input('model', sql.NVarChar, model)
      .input('year', sql.Int, year)
      .input('vin_number', sql.NVarChar, vinNumber)
      .input('purchaseDate', sql.DateTime, new Date(purchaseDate))
      .input('purchasePrice', sql.Money, parseFloat(purchasePrice))
      .input('condition', sql.NVarChar, condition)
      .input('costPrice', sql.Money, parseFloat(costPrice))
      .input('status', sql.NVarChar, status)
      .input('quantity', sql.Int, quantity)
      .input('stock', sql.NVarChar, inventoryStock)
      .input('supplierId', sql.Int, supplierId)
      .input('imagePath', sql.NVarChar, imagePath)
      .query(`
        INSERT INTO cars (make, model, year, vin_number, purchase_price, purchase_date, supplier_id, image_path)
        OUTPUT INSERTED.car_id
        VALUES (@make, @model, @year, @vin_number, @purchasePrice, @purchaseDate, @supplierId, @imagePath)
      `);

    const carId = carResult.recordset[0].car_id;

    // Insert parts + inventory (same as your current code)
    for (let part of JSON.parse(parts)) {
      const partRequest = new sql.Request(transaction);
      const partResult = await partRequest
        .input('carId', sql.Int, carId)
        .input('partName', sql.NVarChar, part.name)
        .input('condition', sql.NVarChar, condition)
        .input('costPrice', sql.Money, parseFloat(costPrice))
        .input('sellingPrice', sql.Money, parseFloat(part.price))
        .input('status', sql.NVarChar, status)
        .query(`
          INSERT INTO parts (car_id, part_name, condition, cost_price, selling_price, status)
          OUTPUT INSERTED.part_id
          VALUES (@carId, @partName, @condition, @costPrice, @sellingPrice, @status)
        `);

      const partId = partResult.recordset[0].part_id;

      const inventoryRequest = new sql.Request(transaction);
      await inventoryRequest
        .input('partId', sql.Int, partId)
        .input('quantity', sql.Int, quantity)
        .input('status', sql.NVarChar, inventoryStock)
        .query(`
          INSERT INTO inventory (part_id, quantity, status)
          VALUES (@partId, @quantity, @status)
        `);

    }

    // Insert into transactions (AFTER car insert, AFTER parts loop)
const totalAmount = parseFloat(purchasePrice) + parseFloat(costPrice);
const description = `I bought ${make} ${model} for ${totalAmount}`;

const txRequest = new sql.Request(transaction);
await txRequest
  .input('type', sql.NVarChar, "Purchase")
  .input('referenceId', sql.Int, carId)
  .input('amount', sql.Money, totalAmount)
  .input('transactionDate', sql.DateTime, new Date()) // use server timestamp, not purchaseDate
  .input('description', sql.NVarChar, description)
  .query(`
    INSERT INTO transactions (type, reference_id, amount, transaction_date, description)
    VALUES (@type, @referenceId, @amount, @transactionDate, @description)
  `);


    await transaction.commit();
    res.status(200).json({ message: 'Car, image, parts, and inventory inserted successfully!' });

  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ error: 'Insert failed. Check server log.' });
  }
});



app.get('/api/car-details', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        c.car_id,
        c.make,
        c.model,
        c.year,
        c.vin_number,
        c.purchase_price,
        c.purchase_date,
        c.image_path,
        c.purchase_price AS car_cost_price,

        -- Supplier details
        s.name AS supplier_name,
        s.phone AS supplier_phone,
        s.email AS supplier_email,
        s.address AS supplier_address,

        -- Part details
        P.part_id,
        p.part_name,
        p.condition AS part_condition,
        p.cost_price AS part_cost_price,
        p.selling_price AS part_selling_price,
        p.status AS part_status,

        -- Inventory details
        i.quantity AS inventory_quantity,
        i.status AS inventory_status

      FROM cars c
      JOIN suppliers s ON c.supplier_id = s.supplier_id
      LEFT JOIN parts p ON c.car_id = p.car_id
      LEFT JOIN inventory i ON p.part_id = i.part_id
      ORDER BY c.car_id, p.part_id;
    `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error fetching car details:', err);
    res.status(500).json({ error: 'Server error fetching car details' });
  }
});

app.put('/api/car-details/:carId', async (req, res) => {
  const { carId } = req.params;
  const {
    make, model, year, vin_number, purchase_price, purchase_date, image_path,
    supplier_name, supplier_phone, supplier_email, supplier_address,
    part_id,
    part_name, part_condition, part_cost_price, part_selling_price, part_status,
    inventory_quantity, inventory_status
  } = req.body;

  console.log("This is part ID"+" "+part_id);

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Update cars table
    await request
      .input('car_id', sql.Int, carId)
      .input('make', sql.VarChar, make)
      .input('model', sql.VarChar, model)
      .input('year', sql.Int, year)
      .input('vin', sql.VarChar, vin_number)
      .input('price', sql.Decimal(10, 2), purchase_price)
      .input('pdate', sql.Date, purchase_date)
      .input('img', sql.VarChar, image_path)
      .query(`
        UPDATE cars SET
          make = @make,
          model = @model,
          year = @year,
          vin_number = @vin,
          purchase_price = @price,
          purchase_date = @pdate,
          image_path = @img
        WHERE car_id = @car_id
      `);

    // Update supplier
    await request
      .input('sname', sql.VarChar, supplier_name)
      .input('sphone', sql.VarChar, supplier_phone)
      .input('semail', sql.VarChar, supplier_email)
      .input('saddr', sql.VarChar, supplier_address)
      .query(`
        UPDATE suppliers SET
          name = @sname,
          phone = @sphone,
          email = @semail,
          address = @saddr
        WHERE supplier_id = (
          SELECT supplier_id FROM cars WHERE car_id = @car_id
        )
      `);

    // Update part by part_id (only if part_id provided)
       // ✅ Update part
       if (part_id) {
        const partRequest = new sql.Request(transaction);
        await partRequest
          .input('part_id', sql.Int, part_id)
          .input('pname', sql.VarChar, part_name)
          .input('pcond', sql.VarChar, part_condition)
          .input('pcost', sql.Decimal(10, 2), part_cost_price)
          .input('psell', sql.Decimal(10, 2), part_selling_price)
          .input('pstatus', sql.VarChar, part_status)
          .query(`
            UPDATE parts SET
              part_name = @pname,
              condition = @pcond,
              cost_price = @pcost,
              selling_price = @psell,
              status = @pstatus
            WHERE part_id = @part_id
          `);
      }
  
      // ✅ Update inventory
      if (part_id) {
        const invRequest = new sql.Request(transaction);
        await invRequest
          .input('part_id', sql.Int, part_id)
          .input('inv_qty', sql.Int, inventory_quantity)
          .input('inv_status', sql.VarChar, inventory_status)
          .query(`
            UPDATE inventory SET
              quantity = @inv_qty,
              status = @inv_status
            WHERE part_id = @part_id
          `);
      }
  

    await transaction.commit();
    res.status(200).json({ message: 'Car details updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Error updating car details' });
  }
});



app.delete('/api/car-details/:carId/:partId', async (req, res) => {
  const { carId, partId } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Use separate Request objects to avoid duplicate parameter issues
    // 1. Delete from sales
    const salesRequest = new sql.Request(transaction);
    await salesRequest
      .input('part_id', sql.Int, partId)
      .query('DELETE FROM sales WHERE part_id = @part_id');

    // 2. Delete from inventory
    const invRequest = new sql.Request(transaction);
    await invRequest
      .input('part_id', sql.Int, partId)
      .query('DELETE FROM inventory WHERE part_id = @part_id');

    // 3. Delete from parts
    const partRequest = new sql.Request(transaction);
    await partRequest
      .input('part_id', sql.Int, partId)
      .query('DELETE FROM parts WHERE part_id = @part_id');

    // 4. Check if any parts remain for this car
    const carCheckRequest = new sql.Request(transaction);
    const partsCountResult = await carCheckRequest
      .input('car_id', sql.Int, carId)
      .query('SELECT COUNT(*) as partsCount FROM parts WHERE car_id = @car_id');

    const partsCount = partsCountResult.recordset[0].partsCount;

    if (partsCount === 0) {
      // 5. Delete car if no parts remain
      const carRequest = new sql.Request(transaction);
      await carRequest
        .input('car_id', sql.Int, carId)
        .query('DELETE FROM cars WHERE car_id = @car_id');
    }

    await transaction.commit();
    res.status(200).json({ message: 'Deleted part, related sales, inventory, and car if no parts remain.' });
  } catch (err) {
    console.error('Deletion error:', err);
    res.status(500).json({ error: 'Error deleting car details. Check foreign key constraints.' });
  }
});


app.get('/api/suppliers-with-vehicle-count', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT s.supplier_id, s.name, COUNT(c.car_id) AS total_vehicles
      FROM suppliers s
      LEFT JOIN cars c ON s.supplier_id = c.supplier_id
      GROUP BY s.supplier_id, s.name
    `);

    res.json(result.recordset); // send only array to frontend
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/api/vehicals',async (req,res) =>{

  try{
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('select * from cars');
    res.json(result.recordset);
  }catch(error){
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/api/Vehicale_inseration', upload.array("photos"),async (req, res) => {
  try {
    const { name, phone, location, make, model, year } = req.body;

    
    const photos = req.files; 
    const carinfo = { name, phone, location, make, model, year,photos};
    console.log("Received:", carinfo);

    res.json({ success: true, message: "Car info received", data: carinfo });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/api/parts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("id", sql.Int, id) // safe parameter binding
      .query("SELECT * FROM parts WHERE part_id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Part not found" });
    }

    res.json(result.recordset[0]); // send single part
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/api/customerinseration', async (req, res) => {
  try {
    const { first_name, last_name, email, phone } = req.body;

    console.log(first_name,last_name,email,phone);

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("name", sql.VarChar, first_name)
      .input("lname", sql.VarChar, last_name)
      .input("customeremail", sql.VarChar, email)
      .input("customerphone", sql.VarChar, phone)
      .query(`
        INSERT INTO customers (First_name, Last_name, email, phone)
        VALUES (@name, @lname, @customeremail, @customerphone)
      `);

    res.json({ message: "Customer inserted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get('/api/selectcustomer', async (req, res) => {
  try {
    // const { name, lname, customerphone, customeremail } = req.body;

    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query("select * from customers");
    
    res.json(result.recordset); 
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.put('/api/selectcustomerupdate/:customer_id', async (req, res) => {
  try {
    const { customer_id, first_name, last_name, email, phone  } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const pool = await sql.connect(dbConfig);
// (First_name, Last_name, email, phone)
    const result = await pool.request()
      .input("customer_id", sql.Int, customer_id)
      .input("First_name", sql.NVarChar, first_name)
      .input("Last_name", sql.NVarChar, last_name)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone)
      .query(`
        UPDATE customers
        SET 
          First_name = @First_name,
          Last_name = @Last_name,
             email = @email,
          phone = @phone
         WHERE customer_id = @customer_id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete('/api/delete/:customer_id', async (req, res) => {
  try {
     const { customer_id } = req.params; // ✅ use params, not body

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("customer_id", sql.Int, customer_id) // ✅ parameterized query
      .query("DELETE FROM customers WHERE customer_id = @customer_id");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer has been successfully deleted" + customer_id });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/salesinseration", async (req, res) => {
  const {
    customer_id,
    part_id,
    car_id, // remove if not needed
    sale_date,
    quantity,
    price_sold,
    amount_paid,
    pending,
    payment_method,
    status,
  } = req.body;

  let pool, transaction;

  try {
    pool = await sql.connect(dbConfig);
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    // 1. Insert into sales
    const salesRequest = new sql.Request(transaction);
    await salesRequest
      .input("customer_id", sql.Int, customer_id)
      .input("part_id", sql.Int, part_id)
      .input("sale_date", sql.Date, sale_date)
      .input("price_sold", sql.Decimal(10, 2), price_sold)
      .input("payment_id", sql.Int, payment_method || null)
      .input("quantity", sql.Int, quantity)
      .input("amount_paid", sql.Decimal(10, 2), amount_paid)
      .input("amount_pending", sql.Decimal(10, 2), pending)
      .input("status", sql.VarChar, status)
      .query(`
        INSERT INTO sales 
          (customer_id, part_id, sale_date, price_sold, payment_id, quantity, Amount_paid, Amount_pending, status)
        VALUES 
          (@customer_id, @part_id, @sale_date, @price_sold, @payment_id, @quantity, @amount_paid, @amount_pending, @status)
      `);

    // 2. Insert into transactions
    const transRequest = new sql.Request(transaction);
    await transRequest
      .input("type", sql.NVarChar, "Sale")
      .input("reference_id", sql.Int, car_id || null) // change if reference_id ≠ car_id
      .input("amount", sql.Decimal(10, 2), price_sold)
      .input("transaction_date", sql.Date, sale_date)
      .input(
        "description",
        sql.NVarChar,
        `I sold ${quantity} part(s) with id ${part_id}`
      )
      .query(`
        INSERT INTO transactions (type, reference_id, amount, transaction_date, description) 
        VALUES (@type, @reference_id, @amount, @transaction_date, @description)
      `);

    // 3. Update inventory
    const inventoryRequest = new sql.Request(transaction);
    await inventoryRequest
      .input("part_id", sql.Int, part_id)
      .input("quantity", sql.Int, quantity)
      .query(`
        UPDATE inventory
        SET quantity = quantity - @quantity,
            status = CASE WHEN quantity - @quantity <= 0 THEN 'out of stock' ELSE 'available' END
        WHERE part_id = @part_id
      `);

    // Commit if all succeed
    await transaction.commit();
    res.json({ message: "Transaction saved successfully and inventory updated" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.put("/api/salesupdate/:sale_id", async (req, res) => {
  const { sale_id } = req.params;
  const {
    customer_id,
    part_id,
    car_id, // optional, depending on your reference
    sale_date,
    quantity,
    price_sold,
    amount_paid,
    pending,
    payment_method,
    status,
  } = req.body;

  let pool, transaction;

  //work on this method
  try {

    console.log(customer_id,part_id,car_id,sale_date,quantity,price_sold,amount_paid,pending,payment_method,status);
    pool = await sql.connect(dbConfig);
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    // 1️⃣ Get the current sale to adjust inventory
    const currentSaleRequest = new sql.Request(transaction);
    const currentSale = await currentSaleRequest
      .input("sale_id", sql.Int, sale_id)
      .query("SELECT part_id, quantity FROM sales WHERE sale_id = @sale_id");

    if (currentSale.recordset.length === 0) {
      throw new Error("Sale not found");
    }

    const oldQuantity = currentSale.recordset[0].quantity;
    const oldPartId = currentSale.recordset[0].part_id;

    // 2️⃣ Update sales
    const salesRequest = new sql.Request(transaction);
    await salesRequest
      .input("sale_id", sql.Int, sale_id)
      .input("customer_id", sql.Int, customer_id)
      .input("part_id", sql.Int, part_id)
      .input("sale_date", sql.Date, sale_date)
      .input("price_sold", sql.Decimal(10, 2), price_sold)
      .input("payment_id", sql.Int, payment_method || null)
      .input("quantity", sql.Int, quantity)
      .input("amount_paid", sql.Decimal(10, 2), amount_paid)
      .input("amount_pending", sql.Decimal(10, 2), pending)
      .input("status", sql.VarChar, status)
      .query(`
        UPDATE sales
        SET customer_id = @customer_id,
            part_id = @part_id,
            sale_date = @sale_date,
            price_sold = @price_sold,
            payment_id = @payment_id,
            quantity = @quantity,
            Amount_paid = @amount_paid,
            Amount_pending = @amount_pending,
            status = @status
        WHERE sale_id = @sale_id
      `);

    // 3️⃣ Update transaction
    const transRequest = new sql.Request(transaction);
    await transRequest
      .input("sale_id", sql.Int, sale_id)
      .input("type", sql.NVarChar, "Sale")
      .input("reference_id", sql.Int, car_id || null)
      .input("amount", sql.Decimal(10, 2), price_sold)
      .input("transaction_date", sql.Date, sale_date)
      .input(
        "description",
        sql.NVarChar,
        `Updated sale: ${quantity} part(s) with id ${part_id}`
      )
      .query(`
        UPDATE transactions
        SET type = @type,
            reference_id = @reference_id,
            amount = @amount,
            transaction_date = @transaction_date,
            description = @description
        WHERE reference_id = @sale_id AND type = 'Sale'
      `);

    // 4️⃣ Adjust inventory
    const inventoryRequest = new sql.Request(transaction);

    // If part_id changed, adjust old inventory
    if (oldPartId !== part_id) {
      // Restore old part quantity
      await inventoryRequest
        .input("old_part_id", sql.Int, oldPartId)
        .input("old_quantity", sql.Int, oldQuantity)
        .query(`
          UPDATE inventory
          SET quantity = quantity + @old_quantity,
              status = CASE WHEN quantity + @old_quantity <= 0 THEN 'out of stock' ELSE 'available' END
          WHERE part_id = @old_part_id
        `);
    }

    // Update current part quantity
    await inventoryRequest
      .input("part_id", sql.Int, part_id)
      .input("quantity", sql.Int, quantity)
      .query(`
        UPDATE inventory
        SET quantity = quantity - @quantity,
            status = CASE WHEN quantity - @quantity <= 0 THEN 'out of stock' ELSE 'available' END
        WHERE part_id = @part_id
      `);

    // 5️⃣ Commit transaction
    await transaction.commit();
    res.json({ message: "Sale updated successfully and inventory adjusted" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




app.get("/api/getsales", async (req, res) => {

  try{


      const pool = await sql.connect(dbConfig);

    const result = await pool.request().query("select * from sales");
  

  res.json(result.recordset); 

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





app.get("/api/getpayment", async (req, res) => {

  try{


      const pool = await sql.connect(dbConfig);

    const result = await pool.request().query("select * from payments");
  

  res.json(result.recordset); 

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getcalcluation", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT 
        SUM(price_sold * quantity) AS total_sales,
        SUM(Amount_pending) AS total_pending,
        SUM(Amount_paid) AS amount_paid
      FROM sales
    `);

    res.json(result.recordset); 
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
  //work on pending total sale and amount paid
});



app.put("/api/inventoryupdate/:inventory_id", async (req, res) => {
  const { quantity, status } = req.body;
  const { inventory_id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("inventory_id", sql.Int, inventory_id)
      .input("quantity", sql.Int, quantity)
      .input("status", sql.VarChar, status)
      .query(`
        UPDATE inventory
        SET quantity = @quantity, status = @status
        WHERE inventory_id = @inventory_id
      `);

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getinventory/:part_id", async (req, res) => {
  try {
    const { part_id } = req.params; // <-- comes from URL, e.g. /api/getinventory/5

    if(part_id !=null){
     console.log("this is the part_ID" + part_id); // problem when i am sending part_id its only one 2 and three thats why its not working
            const pool = await sql.connect(dbConfig);
      const result = await pool
      .request()
      .input("part_id", sql.Int, part_id) // bind the param safely
      .query("SELECT * FROM inventory WHERE part_id = @part_id");

    res.json(result.recordset); 

        console.log(part_id);
      
    }else{
      console.log("part id is not defined");
    }


  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/SelectInventory", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT 
          i.inventory_id,
          i.status,
          i.part_id,
          i.quantity,
          p.part_name,
          p.condition,
          p.cost_price,
          p.selling_price AS part_price,
          c.car_id,
          c.make,
          c.model,
          c.supplier_id,
          s.name AS supplier_name
      FROM inventory i
      INNER JOIN parts p ON i.part_id = p.part_id
      INNER JOIN cars c ON p.car_id = c.car_id
      INNER JOIN suppliers s ON c.supplier_id = s.supplier_id
      ORDER BY c.make, c.model, p.part_name;
    `);

    res.json(result.recordset);


  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





app.get("/api/selectwebcars", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    // ✅ FIX: Call request() as a function
    const result = await pool.request().query("SELECT * FROM web_cars");

    console.log("✅ Cars fetched:", result.recordset.length);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});



app.post("/api/insersellcar", upload.array("photos", 10), async (req, res) => {
  try {


    const { name, phone, make, model, year,location,Email } = req.body;

    // Validate required fields
    if (!name || !phone || !make || !model || !year ||!location || !Email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

  

    const photos = req.files?.map(file => file.path) || [];


    const pool = await sql.connect(dbConfig);

  //  Insert query
    const query = `
      INSERT INTO web_cars (seller_name, phone, make, model, year, photos,location,email)
      VALUES (@seller_name, @phone, @make, @model, @year, @photos,@location,@email)
    `;

    const request = pool.request();
    request.input("seller_name", sql.VarChar, name);
    request.input("phone", sql.VarChar, phone);
    request.input("make", sql.VarChar, make);
    request.input("model", sql.VarChar, model);
    request.input("year", sql.Int, year);
    request.input("photos", sql.NVarChar(sql.MAX), JSON.stringify(photos)); // store as JSON string
    request.input("location",sql.VarChar,location);
    request.input("email",sql.VarChar,Email);

   

    await request.query(query);
    res.json({ message: "✅ Car inserted successfully!" });


  } catch (err) {
    console.error("❌ Error in /api/insersellcar:", err);
    res.status(500).json({ error: "Server error" });
  }
});




app.delete("/api/web_vehcale_delete/:car_id", async (req, res) => {
  try {
    const { car_id } = req.params;

    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    // Add the parameter safely
    request.input("car_id", sql.Int, car_id);

    const result = await request.query("DELETE FROM web_cars WHERE car_id = @car_id");

    // Check if a row was deleted
    if (result.rowsAffected[0] > 0) {
      res.json({ message: `✅ Vehicle with ID ${car_id} deleted successfully!` });
    } else {
      res.status(404).json({ error: "Vehicle not found." });
    }

  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ error: "Server error while deleting vehicle." });
  }
});


app.post("/api/contactforminseration", async (req, res) => {
  const { Fullname, Email, Message } = req.body;

  // Validate inputs
  if (!Fullname || !Email || !Message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Connect to database
    const pool = await sql.connect(dbConfig);

    // Insert data into contact_section
    await pool.request()
      .input("full_name", sql.NVarChar, Fullname)
      .input("email", sql.NVarChar, Email)
      .input("message", sql.NVarChar, Message)
      .query(`
        INSERT INTO contact_section (full_name, email, message)
        VALUES (@full_name, @email, @message)
      `);

    // Respond with success
    res.status(200).json({ message: "Message submitted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});






app.get("/api/contactform", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    // Select all messages, latest first
    const result = await pool.request()
      .query(`
        SELECT id, full_name, email, message, is_read,submitted_at
        FROM contact_section
        ORDER BY submitted_at DESC
      `);

    // Send data to frontend
    res.status(200).json(result.recordset);

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





app.post("/api/send-email", async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ error: "Missing email, subject, or message" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

    await transporter.sendMail({
      from: `"Admin Dashboard" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `<p>${message}</p>`,
    });

    res.json({ success: true, message: `Email sent successfully to ${to}` });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});






//delete message
app.delete("/api/delete_msg/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM contact_section WHERE id = @id");

    if (result.rowsAffected[0] > 0) {
      res.json({ message: "Message deleted successfully" });
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Server error while deleting message" });
  }
});



app.put("/api/messages/:id/mark-read", async (req, res) => {
  const { id } = req.params;
  console.log("This is " + id);

  try {
    const pool = await sql.connect(dbConfig);

    await pool
      .request()
      .input("id", sql.Int, id)
      .query("UPDATE contact_section SET is_read = 1 WHERE id = @id");

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating message status");
  }
});


app.get("/api/unreadmsgs",async (req,res)=>{


  try{
    const pool = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT COUNT(*) AS unreadCount
    FROM contact_section
    WHERE is_read = 0
  `);


    const unreadCount = result.recordset[0].unreadCount;
   res.status(200).json({ unreadCount }); // send only count


  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/logout", (req, res) => {
  try {
    // Destroy the session completely
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Could not log out" });
      }

      // Clear session cookie
      res.clearCookie("connect.sid", { path: "/" });
      return res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});















// async function migratePasswords() {
//   try {
//     const pool = await sql.connect(dbConfig);
//     const users = await pool.request().query('SELECT admin_id, password_hash FROM admin_users');

//     for (const user of users.recordset) {
//       const plainPassword = user.password_hash;

//       // Skip if already hashed
//       if (plainPassword.startsWith('$2b$')) continue;

//       const hashed = await bcrypt.hash(plainPassword, saltRounds);

//       await pool.request()
//         .input('hashed', sql.NVarChar, hashed)
//         .input('id', sql.Int, user.admin_id)
//         .query('UPDATE admin_users SET password_hash = @hashed WHERE admin_id = @id');
//     }

//     console.log('Passwords migrated to bcrypt hashes.');
//   } catch (err) {
//     console.error('Migration error:', err);
//   }
// }


// migratePasswords(); // 🔒 Run this only once, then comment it out
