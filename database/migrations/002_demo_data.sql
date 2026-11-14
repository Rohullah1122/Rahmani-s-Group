-- Demo data so the live site is not empty

INSERT INTO payments (payment_method) VALUES ('Cash'), ('Debit'), ('Credit card'), ('E-transfer');

INSERT INTO suppliers (name, phone, email, address) VALUES
('Prairie Auto Auction', '403-555-0142', 'sales@prairieauction.example', 'Calgary, AB'),
('Northside Towing',     '403-555-0178', 'dispatch@northsidetow.example', 'Airdrie, AB');

INSERT INTO cars (make, model, year, vin_number, purchase_price, purchase_date, supplier_id, image_path) VALUES
('Toyota', 'RAV4',     2001, 'JTEHH20V010012345', 900.00,  '2025-08-04', 2, '/seed/toyota_rav4.jpg'),
('Kia',    'Sorento',  2022, '5XYRK4LF6NG012345', 6500.00, '2025-09-12', 1, '/seed/kia_sorento.jpg'),
('Lexus',  'IS 250',   2014, 'JTHBF1D29E5012345', 3200.00, '2025-10-20', 1, '/seed/lexus_is.jpg');

INSERT INTO parts (car_id, part_name, condition, cost_price, selling_price, status) VALUES
(1, 'Engine',            'Used', 300.00, 650.00,  'available'),
(1, 'Spare tire carrier', 'Used', 20.00,  60.00,   'available'),
(2, 'Transmission',      'Used', 900.00, 1800.00, 'available'),
(2, 'Headlight (left)',  'Used', 80.00,  220.00,  'available'),
(3, 'Alloy wheels (4)',  'Used', 250.00, 600.00,  'available'),
(3, 'Rear bumper',       'Used', 90.00,  250.00,  'available');

INSERT INTO inventory (part_id, quantity, status) VALUES
(1, 1, 'available'), (2, 1, 'available'), (3, 1, 'available'),
(4, 2, 'available'), (5, 1, 'available'), (6, 1, 'available');

INSERT INTO customers ("First_name", "Last_name", email, phone) VALUES
('Ali',   'Karimi', 'ali.karimi@example.com', '403-555-0101'),
('Sarah', 'Brooks', 'sarah.brooks@example.com', '403-555-0102');

INSERT INTO sales (customer_id, part_id, sale_date, price_sold, payment_id, quantity, "Amount_paid", "Amount_pending", status) VALUES
(1, 4, '2025-10-02', 220.00, 1, 1, 220.00, 0,      'Paid'),
(2, 6, '2025-11-05', 250.00, 4, 1, 150.00, 100.00, 'Pending');

UPDATE inventory SET quantity = quantity - 1 WHERE part_id IN (4, 6);
UPDATE inventory SET status = 'out of stock' WHERE quantity <= 0;

INSERT INTO transactions (type, reference_id, amount, transaction_date, description) VALUES
('Purchase', 1, 900.00,  '2025-08-04', 'I bought Toyota RAV4 for 900'),
('Purchase', 2, 6500.00, '2025-09-12', 'I bought Kia Sorento for 6500'),
('Purchase', 3, 3200.00, '2025-10-20', 'I bought Lexus IS 250 for 3200'),
('Sale',     2, 220.00,  '2025-10-02', 'I sold 1 part(s) with id 4'),
('Sale',     3, 250.00,  '2025-11-05', 'I sold 1 part(s) with id 6');
