export const EXAMPLES = [
  {
    label: "Simple SELECT",
    code: `SELECT * FROM users`,
  },
  {
    label: "SELECT with WHERE",
    code: `SELECT name, email, age 
FROM users 
WHERE age > 25`,
  },
  {
    label: "INNER JOIN",
    code: `SELECT users.name, orders.product, orders.total
FROM users
INNER JOIN orders ON users.id = orders.user_id`,
  },
  {
    label: "COUNT & GROUP BY",
    code: `SELECT city, COUNT(*) as user_count
FROM users
GROUP BY city
ORDER BY user_count DESC`,
  },
  {
    label: "INSERT New Data",
    code: `INSERT INTO users (name, email, age, city, status) 
VALUES ('John Doe', 'john@example.com', 25, 'Boston', 'active')`,
  },
  {
    label: "UPDATE Record",
    code: `UPDATE users 
SET age = 29, city = 'Seattle'
WHERE id = 1`,
  },
  {
    label: "DELETE Record",
    code: `DELETE FROM users 
WHERE status = 'inactive'`,
  },
  {
    label: "CREATE TABLE",
    code: `CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL,
  stock INTEGER DEFAULT 0
)`,
  },
  {
    label: "LEFT JOIN",
    code: `SELECT users.name, orders.product, orders.total
FROM users
LEFT JOIN orders ON users.id = orders.user_id`,
  },
  {
    label: "RIGHT JOIN",
    code: `SELECT users.name, orders.product, orders.total
FROM users
RIGHT JOIN orders ON users.id = orders.user_id`,
  },
  {
    label: "Aggregates",
    code: `SELECT 
  COUNT(*) as total_users,
  AVG(age) as avg_age,
  MAX(age) as max_age,
  MIN(age) as min_age
FROM users`,
  },
  {
    label: "Multiple WHERE",
    code: `SELECT name, email, city FROM users 
WHERE age > 25 AND city = 'NYC'`,
  },
  {
    label: "DISTINCT Values",
    code: `SELECT DISTINCT city 
FROM users 
ORDER BY city`,
  },
  {
    label: "LIMIT",
    code: `SELECT * FROM orders 
ORDER BY total DESC 
LIMIT 3`,
  },
  {
    label: "High Value Orders",
    code: `SELECT users.name, SUM(orders.total) as total_spent
FROM users
INNER JOIN orders ON users.id = orders.user_id
GROUP BY users.name
HAVING total_spent > 100
ORDER BY total_spent DESC`,
  },
];
