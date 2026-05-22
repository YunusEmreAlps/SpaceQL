export const SQL_SCHEMA = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER,
    city TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    product TEXT,
    total REAL,
    order_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  INSERT INTO users (id, name, email, age, city, status, created_at) VALUES
    (1, 'Alice Johnson', 'alice@example.com', 28, 'NYC', 'active', '2024-01-15'),
    (2, 'Bob Smith', 'bob@example.com', 35, 'LA', 'active', '2024-02-20'),
    (3, 'Carol White', 'carol@example.com', 22, 'NYC', 'inactive', '2024-03-10'),
    (4, 'David Brown', 'david@example.com', 45, 'Chicago', 'active', '2024-01-25'),
    (5, 'Eve Davis', 'eve@example.com', 31, 'LA', 'active', '2024-04-05');

  INSERT INTO orders (id, user_id, product, total, order_date) VALUES
    (1, 1, 'Laptop', 1200.50, '2024-05-01'),
    (2, 1, 'Mouse', 25.99, '2024-05-02'),
    (3, 2, 'Keyboard', 89.99, '2024-05-03'),
    (4, 4, 'Monitor', 350.00, '2024-05-04'),
    (5, 5, 'Headphones', 150.00, '2024-05-05');`;
