import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import session from 'express-session';
import passport from "passport";
import cors from "cors";
import { fileURLToPath } from 'url';


// Load environment variables (server.env next to this file, only used on your computer)
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, 'server.env') });

const onVercel = !!process.env.VERCEL;

// Initialize app
const app = express();
app.set('trust proxy', 1); // Vercel sits in front of the app
app.use(express.json());

// uploaded photos on your computer go to server/uploads (on Vercel they go to Vercel Blob)
const uploadsDir = path.join(here, "uploads");
if (!onVercel && !fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use("/uploads", express.static(uploadsDir));

// Multer keeps the file in memory, then saveFile() stores it
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB per photo
});

// Saves one uploaded photo and returns the path or URL to keep in the database
const saveFile = async (file) => {
  const name = Date.now() + "-" + crypto.randomBytes(3).toString("hex") + path.extname(file.originalname).toLowerCase();

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`rahmanis/${name}`, file.buffer, { access: "public", contentType: file.mimetype });
    return blob.url;
  }

  fs.writeFileSync(path.join(uploadsDir, name), file.buffer);
  return `/uploads/${name}`;
};

const saltRounds = 10;

// DB config: one PostgreSQL connection string (Neon on Vercel, your own Postgres locally)
pg.types.setTypeParser(1700, (v) => v === null ? null : parseFloat(v)); // NUMERIC -> number (like mssql Money)
pg.types.setTypeParser(20, (v) => v === null ? null : parseInt(v, 10));  // COUNT(*) -> number
pg.types.setTypeParser(1082, (v) => v);                                   // DATE stays 'YYYY-MM-DD'

const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: local ? false : { rejectUnauthorized: false },
  max: onVercel ? 3 : 10,
});



app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",  // React frontend
  credentials: true,                // Allow cookies/auth headers
}));



export { app, upload, pool };



// Sessions are saved in the "session" table, so a login keeps working on Vercel
class PgStore extends session.Store {
  get(sid, cb) {
    pool.query("SELECT sess FROM session WHERE sid = $1 AND expire > now()", [sid])
      .then((r) => cb(null, r.rows[0] ? r.rows[0].sess : null))
      .catch(cb);
  }
  set(sid, sess, cb) {
    const expire = new Date(Date.now() + (sess.cookie?.maxAge || 3600000));
    pool.query(
      `INSERT INTO session (sid, sess, expire) VALUES ($1, $2, $3)
       ON CONFLICT (sid) DO UPDATE SET sess = $2, expire = $3`,
      [sid, JSON.stringify(sess), expire])
      .then(() => cb && cb(null))
      .catch((e) => cb && cb(e));
  }
  destroy(sid, cb) {
    pool.query("DELETE FROM session WHERE sid = $1", [sid])
      .then(() => cb && cb(null))
      .catch((e) => cb && cb(e));
  }
  touch(sid, sess, cb) {
    this.set(sid, sess, cb);
  }
}

app.use(
  session({
    store: new PgStore(),
    secret: process.env.SECRET || process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: onVercel,   // HTTPS only on Vercel
      sameSite: "lax",
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
    const result = await pool.query('SELECT admin_id, username, email FROM admin_users WHERE admin_id = $1', [id]);
    done(null, result.rows[0] || false); // attach user to req.user
  } catch (err) {
    done(err, null);
  }
});



app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});


app.get("/api/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});


// only logged in admins can use the admin routes
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}



const PORT = process.env.PORT || 5000;
if (!onVercel) app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.post('/api/login', async (req, res) => {
  const { adminName, adminPassword } = req.body;

  if (!adminName || !adminPassword) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM admin_users WHERE LOWER(username) = $1', [adminName.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username' });
    }


    const user = result.rows[0];
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





app.get('/api/parts', ensureAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parts ORDER BY part_id');
    res.json(result.rows);
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
    // 🔐 First, check if the email exists in admin_users
    const userResult = await pool.query('SELECT * FROM admin_users WHERE LOWER(email) = LOWER($1)', [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // ✅ Email exists, insert the token into password_resets
    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [userResult.rows[0].email, token, expires]
    );

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // the link goes back to the same site the request came from
    const site = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const resetLink = `${site}/reset-password/${token}`;

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: userResult.rows[0].email,
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
    // Check if token is valid and not expired
    const result = await pool.query('SELECT * FROM password_resets WHERE token = $1 AND expires_at > now()', [token]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const userEmail = result.rows[0].email;

    // Update the password in admin_users
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await pool.query('UPDATE admin_users SET password_hash = $1 WHERE email = $2', [hashedPassword, userEmail]);

    // delete the token so it can’t be reused
    await pool.query('DELETE FROM password_resets WHERE token = $1', [token]);

    res.json({ message: 'Password has been reset successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/api/sale', ensureAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(s.sale_date, 'YYYY-MM') AS sale_month,
        SUM(s.price_sold) AS total_sales
      FROM sales s
      GROUP BY TO_CHAR(s.sale_date, 'YYYY-MM')
      ORDER BY sale_month
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sales data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.post('/api/purchased', ensureAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(purchase_date, 'YYYY-MM-DD') AS purchase_date,
        SUM(purchase_price) AS total_purchase
      FROM cars
      GROUP BY TO_CHAR(purchase_date, 'YYYY-MM-DD')
      ORDER BY purchase_date
    `);

    res.json(result.rows);  // send data back in response
  } catch (err) {
    console.error('Error fetching purchase data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




app.post('/api/insert-car', ensureAuth, upload.single("carImage"), async (req, res) => {
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
    parts,
    status,
    quantity,
    inventoryStock
  } = req.body;

  const client = await pool.connect();

  try {
    // uploaded image file info
    const imagePath = req.file ? await saveFile(req.file) : null;

    await client.query('BEGIN');

    // Supplier insert
    const supplierResult = await client.query(
      `INSERT INTO suppliers (name, phone, email, address)
       VALUES ($1, $2, $3, $4) RETURNING supplier_id`,
      [supplierName, supplierPhone, supplierEmail, supplierAddress]
    );
    const supplierId = supplierResult.rows[0].supplier_id;

    // Car insert WITH image_path
    const carResult = await client.query(
      `INSERT INTO cars (make, model, year, vin_number, purchase_price, purchase_date, supplier_id, image_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING car_id`,
      [make, model, parseInt(year, 10) || null, vinNumber, parseFloat(purchasePrice) || 0, purchaseDate || null, supplierId, imagePath]
    );
    const carId = carResult.rows[0].car_id;

    // Insert parts + inventory
    for (let part of JSON.parse(parts || "[]")) {
      const partResult = await client.query(
        `INSERT INTO parts (car_id, part_name, condition, cost_price, selling_price, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING part_id`,
        [carId, part.name, condition, parseFloat(costPrice) || 0, parseFloat(part.price) || 0, status]
      );
      const partId = partResult.rows[0].part_id;

      await client.query(
        'INSERT INTO inventory (part_id, quantity, status) VALUES ($1, $2, $3)',
        [partId, parseInt(quantity, 10) || 0, inventoryStock]
      );
    }

    // Insert into transactions (AFTER car insert, AFTER parts loop)
    const totalAmount = (parseFloat(purchasePrice) || 0) + (parseFloat(costPrice) || 0);
    const description = `I bought ${make} ${model} for ${totalAmount}`;

    await client.query(
      `INSERT INTO transactions (type, reference_id, amount, transaction_date, description)
       VALUES ($1, $2, $3, now(), $4)`,
      ["Purchase", carId, totalAmount, description]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Car, image, parts, and inventory inserted successfully!' });

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Insert error:', err);
    res.status(500).json({ error: 'Insert failed. Check server log.' });
  } finally {
    client.release();
  }
});



app.get('/api/car-details', ensureAuth, async (req, res) => {
  try {
    const result = await pool.query(`
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
        p.part_id,
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
      ORDER BY c.car_id, p.part_id
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching car details:', err);
    res.status(500).json({ error: 'Server error fetching car details' });
  }
});

app.put('/api/car-details/:carId', ensureAuth, async (req, res) => {
  const { carId } = req.params;
  const {
    make, model, year, vin_number, purchase_price, purchase_date, image_path,
    supplier_name, supplier_phone, supplier_email, supplier_address,
    part_id,
    part_name, part_condition, part_cost_price, part_selling_price, part_status,
    inventory_quantity, inventory_status
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update cars table
    await client.query(
      `UPDATE cars SET
         make = $1, model = $2, year = $3, vin_number = $4,
         purchase_price = $5, purchase_date = $6, image_path = $7
       WHERE car_id = $8`,
      [make, model, year, vin_number, purchase_price, purchase_date ? String(purchase_date).slice(0, 10) : null, image_path, carId]
    );

    // Update supplier
    await client.query(
      `UPDATE suppliers SET name = $1, phone = $2, email = $3, address = $4
       WHERE supplier_id = (SELECT supplier_id FROM cars WHERE car_id = $5)`,
      [supplier_name, supplier_phone, supplier_email, supplier_address, carId]
    );

    // ✅ Update part and its inventory (only if part_id provided)
    if (part_id) {
      await client.query(
        `UPDATE parts SET part_name = $1, condition = $2, cost_price = $3, selling_price = $4, status = $5
         WHERE part_id = $6`,
        [part_name, part_condition, part_cost_price, part_selling_price, part_status, part_id]
      );

      await client.query(
        'UPDATE inventory SET quantity = $1, status = $2 WHERE part_id = $3',
        [inventory_quantity, inventory_status, part_id]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Car details updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Update error:', err);
    res.status(500).json({ error: 'Error updating car details' });
  } finally {
    client.release();
  }
});



app.delete('/api/car-details/:carId/:partId', ensureAuth, async (req, res) => {
  const { carId, partId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Delete from sales  2. inventory  3. parts
    await client.query('DELETE FROM sales WHERE part_id = $1', [partId]);
    await client.query('DELETE FROM inventory WHERE part_id = $1', [partId]);
    await client.query('DELETE FROM parts WHERE part_id = $1', [partId]);

    // 4. Check if any parts remain for this car
    const partsCountResult = await client.query('SELECT COUNT(*) AS parts_count FROM parts WHERE car_id = $1', [carId]);

    if (partsCountResult.rows[0].parts_count === 0) {
      // 5. Delete car if no parts remain
      await client.query('DELETE FROM cars WHERE car_id = $1', [carId]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Deleted part, related sales, inventory, and car if no parts remain.' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Deletion error:', err);
    res.status(500).json({ error: 'Error deleting car details. Check foreign key constraints.' });
  } finally {
    client.release();
  }
});


app.get('/api/suppliers-with-vehicle-count', ensureAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.supplier_id, s.name, COUNT(c.car_id) AS total_vehicles
      FROM suppliers s
      LEFT JOIN cars c ON s.supplier_id = c.supplier_id
      GROUP BY s.supplier_id, s.name
      ORDER BY s.supplier_id
    `);

    res.json(result.rows); // send only array to frontend
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// public: the inventory page shows these cars
app.get('/api/vehicals', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cars ORDER BY car_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get("/api/parts/:id", ensureAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM parts WHERE part_id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Part not found" });
    }

    res.json(result.rows[0]); // send single part
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/api/customerinseration', ensureAuth, async (req, res) => {
  try {
    const { first_name, last_name, email, phone } = req.body;

    await pool.query(
      'INSERT INTO customers ("First_name", "Last_name", email, phone) VALUES ($1, $2, $3, $4)',
      [first_name, last_name, email, phone]
    );

    res.json({ message: "Customer inserted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get('/api/selectcustomer', ensureAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY customer_id");
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.put('/api/selectcustomerupdate/:customer_id', ensureAuth, async (req, res) => {
  try {
    const customer_id = req.body.customer_id || req.params.customer_id;
    const { first_name, last_name, email, phone } = req.body;

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const result = await pool.query(
      `UPDATE customers SET "First_name" = $1, "Last_name" = $2, email = $3, phone = $4
       WHERE customer_id = $5`,
      [first_name, last_name, email, phone, customer_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete('/api/delete/:customer_id', ensureAuth, async (req, res) => {
  try {
    const { customer_id } = req.params; // ✅ use params, not body

    if (!customer_id) {
      return res.status(400).json({ error: "Customer ID is required" });
    }

    const result = await pool.query("DELETE FROM customers WHERE customer_id = $1", [customer_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json({ message: "Customer has been successfully deleted" + customer_id });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/salesinseration", ensureAuth, async (req, res) => {
  const {
    customer_id,
    part_id,
    car_id,
    sale_date,
    quantity,
    price_sold,
    amount_paid,
    pending,
    payment_method,
    status,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert into sales
    await client.query(
      `INSERT INTO sales
         (customer_id, part_id, sale_date, price_sold, payment_id, quantity, "Amount_paid", "Amount_pending", status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [customer_id, part_id, sale_date, price_sold, payment_method || null, quantity, amount_paid, pending, status]
    );

    // 2. Insert into transactions
    await client.query(
      `INSERT INTO transactions (type, reference_id, amount, transaction_date, description)
       VALUES ($1, $2, $3, $4, $5)`,
      ["Sale", car_id || null, price_sold, sale_date, `I sold ${quantity} part(s) with id ${part_id}`]
    );

    // 3. Update inventory
    await client.query(
      `UPDATE inventory
       SET quantity = quantity - $1,
           status = CASE WHEN quantity - $1 <= 0 THEN 'out of stock' ELSE 'available' END
       WHERE part_id = $2`,
      [quantity, part_id]
    );

    // Commit if all succeed
    await client.query('COMMIT');
    res.json({ message: "Transaction saved successfully and inventory updated" });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});



app.put("/api/salesupdate/:sale_id", ensureAuth, async (req, res) => {
  const { sale_id } = req.params;
  const {
    customer_id,
    part_id,
    car_id,
    sale_date,
    quantity,
    price_sold,
    amount_paid,
    pending,
    payment_method,
    status,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Get the current sale to adjust inventory
    const currentSale = await client.query("SELECT part_id, quantity FROM sales WHERE sale_id = $1", [sale_id]);

    if (currentSale.rows.length === 0) {
      throw new Error("Sale not found");
    }

    const oldQuantity = currentSale.rows[0].quantity;
    const oldPartId = currentSale.rows[0].part_id;

    // 2️⃣ Update sales
    await client.query(
      `UPDATE sales
       SET customer_id = $1, part_id = $2, sale_date = $3, price_sold = $4, payment_id = $5,
           quantity = $6, "Amount_paid" = $7, "Amount_pending" = $8, status = $9
       WHERE sale_id = $10`,
      [customer_id, part_id, sale_date, price_sold, payment_method || null, quantity, amount_paid, pending, status, sale_id]
    );

    // 3️⃣ Update transaction
    await client.query(
      `UPDATE transactions
       SET type = $1, reference_id = $2, amount = $3, transaction_date = $4, description = $5
       WHERE reference_id = $6 AND type = 'Sale'`,
      ["Sale", car_id || null, price_sold, sale_date, `Updated sale: ${quantity} part(s) with id ${part_id}`, sale_id]
    );

    // 4️⃣ Adjust inventory: give back the old quantity, then take the new one
    await client.query(
      `UPDATE inventory
       SET quantity = quantity + $1,
           status = CASE WHEN quantity + $1 <= 0 THEN 'out of stock' ELSE 'available' END
       WHERE part_id = $2`,
      [oldQuantity, oldPartId]
    );

    await client.query(
      `UPDATE inventory
       SET quantity = quantity - $1,
           status = CASE WHEN quantity - $1 <= 0 THEN 'out of stock' ELSE 'available' END
       WHERE part_id = $2`,
      [quantity, part_id]
    );

    // 5️⃣ Commit transaction
    await client.query('COMMIT');
    res.json({ message: "Sale updated successfully and inventory adjusted" });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
});




app.get("/api/getsales", ensureAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sales ORDER BY sale_id");
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





app.get("/api/getpayment", ensureAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM payments ORDER BY payment_id");
    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getcalcluation", ensureAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        SUM(price_sold * quantity) AS total_sales,
        SUM("Amount_pending") AS total_pending,
        SUM("Amount_paid") AS amount_paid
      FROM sales
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.put("/api/inventoryupdate/:inventory_id", ensureAuth, async (req, res) => {
  const { quantity, status } = req.body;
  const { inventory_id } = req.params;

  try {
    await pool.query(
      'UPDATE inventory SET quantity = $1, status = $2 WHERE inventory_id = $3',
      [quantity, status, inventory_id]
    );

    res.json({ message: "Inventory updated successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/api/getinventory/:part_id", ensureAuth, async (req, res) => {
  try {
    const { part_id } = req.params; // <-- comes from URL, e.g. /api/getinventory/5

    const result = await pool.query("SELECT * FROM inventory WHERE part_id = $1", [part_id]);
    res.json(result.rows);

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/SelectInventory", ensureAuth, async (req, res) => {
  try {
    const result = await pool.query(`
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
      ORDER BY c.make, c.model, p.part_name
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





app.get("/api/selectwebcars", ensureAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM web_cars ORDER BY car_id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// public: "Sell My Car" form
app.post("/api/insersellcar", upload.array("photos", 10), async (req, res) => {
  try {
    const { name, phone, make, model, year, location, Email } = req.body;

    // Validate required fields
    if (!name || !phone || !make || !model || !year || !location || !Email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // save every photo and keep the list of paths/URLs
    const photos = [];
    for (const file of req.files || []) {
      photos.push(await saveFile(file));
    }

    await pool.query(
      `INSERT INTO web_cars (seller_name, phone, make, model, year, photos, location, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [name, phone, make, model, parseInt(year, 10) || null, JSON.stringify(photos), location, Email]
    );

    res.json({ message: "✅ Car inserted successfully!" });

  } catch (err) {
    console.error("❌ Error in /api/insersellcar:", err);
    res.status(500).json({ error: "Server error" });
  }
});




app.delete("/api/web_vehcale_delete/:car_id", ensureAuth, async (req, res) => {
  try {
    const { car_id } = req.params;

    const result = await pool.query("DELETE FROM web_cars WHERE car_id = $1", [car_id]);

    // Check if a row was deleted
    if (result.rowCount > 0) {
      res.json({ message: `✅ Vehicle with ID ${car_id} deleted successfully!` });
    } else {
      res.status(404).json({ error: "Vehicle not found." });
    }

  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ error: "Server error while deleting vehicle." });
  }
});


// public: contact form
app.post("/api/contactforminseration", async (req, res) => {
  const { Fullname, Email, Message } = req.body;

  // Validate inputs
  if (!Fullname || !Email || !Message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await pool.query(
      'INSERT INTO contact_section (full_name, email, message) VALUES ($1, $2, $3)',
      [Fullname, Email, Message]
    );

    // Respond with success
    res.status(200).json({ message: "Message submitted successfully" });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});






app.get("/api/contactform", ensureAuth, async (req, res) => {
  try {
    // Select all messages, latest first
    const result = await pool.query(`
      SELECT id, full_name, email, message, is_read, submitted_at
      FROM contact_section
      ORDER BY submitted_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





app.post("/api/send-email", ensureAuth, async (req, res) => {
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
app.delete("/api/delete_msg/:id", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM contact_section WHERE id = $1", [id]);

    if (result.rowCount > 0) {
      res.json({ message: "Message deleted successfully" });
    } else {
      res.status(404).json({ error: "Message not found" });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Server error while deleting message" });
  }
});



app.put("/api/messages/:id/mark-read", ensureAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("UPDATE contact_section SET is_read = true WHERE id = $1", [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating message status");
  }
});


app.get("/api/unreadmsgs", ensureAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) AS "unreadCount" FROM contact_section WHERE is_read = false');

    const unreadCount = result.rows[0].unreadCount;
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


// photo too big or another upload problem
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "Each photo must be 4 MB or smaller." : err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
