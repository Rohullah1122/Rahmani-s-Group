-- Rahmani's Junkyard database (PostgreSQL)
-- Same tables as the old SQL Server version. Mixed-case columns are quoted so the API sends the same names to React.

CREATE TABLE admin_users (
    admin_id      SERIAL PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE password_resets (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    phone       VARCHAR(50),
    email       VARCHAR(255),
    address     VARCHAR(255)
);

CREATE TABLE cars (
    car_id         SERIAL PRIMARY KEY,
    make           VARCHAR(100) NOT NULL,
    model          VARCHAR(100) NOT NULL,
    year           INT,
    vin_number     VARCHAR(50) UNIQUE,
    purchase_price NUMERIC(12,2),
    purchase_date  DATE,
    supplier_id    INT REFERENCES suppliers(supplier_id),
    image_path     TEXT
);

CREATE TABLE parts (
    part_id       SERIAL PRIMARY KEY,
    car_id        INT REFERENCES cars(car_id) ON DELETE CASCADE,
    part_name     VARCHAR(150) NOT NULL,
    condition     VARCHAR(50),
    cost_price    NUMERIC(12,2),
    selling_price NUMERIC(12,2),
    status        VARCHAR(50)
);

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    part_id      INT REFERENCES parts(part_id) ON DELETE CASCADE,
    quantity     INT NOT NULL DEFAULT 0,
    status       VARCHAR(50)
);

CREATE TABLE customers (
    customer_id  SERIAL PRIMARY KEY,
    "First_name" VARCHAR(100),
    "Last_name"  VARCHAR(100),
    email        VARCHAR(255),
    phone        VARCHAR(50)
);

CREATE TABLE payments (
    payment_id     SERIAL PRIMARY KEY,
    payment_method VARCHAR(50) NOT NULL
);

CREATE TABLE sales (
    sale_id          SERIAL PRIMARY KEY,
    customer_id      INT REFERENCES customers(customer_id) ON DELETE SET NULL,
    part_id          INT REFERENCES parts(part_id) ON DELETE CASCADE,
    sale_date        DATE,
    price_sold       NUMERIC(12,2),
    payment_id       INT REFERENCES payments(payment_id),
    quantity         INT,
    "Amount_paid"    NUMERIC(12,2),
    "Amount_pending" NUMERIC(12,2),
    status           VARCHAR(50)
);

CREATE TABLE transactions (
    transaction_id   SERIAL PRIMARY KEY,
    type             VARCHAR(50),
    reference_id     INT,
    amount           NUMERIC(12,2),
    transaction_date TIMESTAMPTZ,
    description      TEXT
);

-- cars people want to sell to the yard (from the "Sell My Car" page)
CREATE TABLE web_cars (
    car_id      SERIAL PRIMARY KEY,
    seller_name VARCHAR(150),
    phone       VARCHAR(50),
    email       VARCHAR(255),
    location    VARCHAR(255),
    make        VARCHAR(100),
    model       VARCHAR(100),
    year        INT,
    photos      TEXT,          -- JSON list of photo paths or URLs
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_section (
    id           SERIAL PRIMARY KEY,
    full_name    VARCHAR(150),
    email        VARCHAR(255),
    message      TEXT,
    is_read      BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- login sessions (so admins stay logged in on Vercel)
CREATE TABLE session (
    sid    VARCHAR PRIMARY KEY,
    sess   JSON NOT NULL,
    expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX session_expire_idx ON session (expire);
