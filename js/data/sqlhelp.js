/**
 * SQL Syntax Helper Data
 * Comprehensive SQL command reference with syntax and examples
 */

export const SQL_HELP = {
  SELECT: {
    title: "SELECT - Query Data",
    syntax: `SELECT column1, column2, ...
FROM table_name
WHERE condition
GROUP BY column
HAVING condition
ORDER BY column [ASC|DESC]
LIMIT number;`,
    examples: [
      {
        label: "Basic SELECT",
        code: "SELECT * FROM users;",
        description: "Select all columns from users table",
      },
      {
        label: "SELECT with WHERE",
        code: "SELECT name, age FROM users WHERE age > 18;",
        description: "Filter rows by condition",
      },
      {
        label: "SELECT with ORDER BY",
        code: "SELECT * FROM users ORDER BY age DESC;",
        description: "Sort results by age (descending)",
      },
      {
        label: "SELECT with LIMIT",
        code: "SELECT * FROM users LIMIT 5;",
        description: "Get only first 5 rows",
      },
      {
        label: "SELECT with GROUP BY",
        code: "SELECT country, COUNT(*) FROM users GROUP BY country;",
        description: "Count users per country",
      },
    ],
    tips: [
      "Use * to select all columns",
      "WHERE filters rows before grouping",
      "HAVING filters after GROUP BY",
      "ORDER BY sorts the result set",
    ],
  },

  INSERT: {
    title: "INSERT - Add Data",
    syntax: `INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);`,
    examples: [
      {
        label: "Insert Single Row",
        code: "INSERT INTO users (name, age, email) VALUES ('John', 25, 'john@example.com');",
        description: "Add one row to users table",
      },
      {
        label: "Insert Multiple Rows",
        code: "INSERT INTO users (name, age) VALUES ('Alice', 30), ('Bob', 28);",
        description: "Add multiple rows at once",
      },
      {
        label: "Insert All Columns",
        code: "INSERT INTO users VALUES (1, 'Jane', 22, 'jane@example.com');",
        description: "Insert without specifying column names",
      },
    ],
    tips: [
      "Always specify column names for clarity",
      "String values must be in quotes",
      "Column order must match value order",
      "NULL can be used for missing values",
    ],
  },

  UPDATE: {
    title: "UPDATE - Modify Data",
    syntax: `UPDATE table_name
SET column1 = value1, column2 = value2, ...
WHERE condition;`,
    examples: [
      {
        label: "Update Single Column",
        code: "UPDATE users SET age = 26 WHERE name = 'John';",
        description: "Update age for specific user",
      },
      {
        label: "Update Multiple Columns",
        code: "UPDATE users SET age = 35, email = 'newemail@example.com' WHERE id = 5;",
        description: "Update multiple fields at once",
      },
      {
        label: "Update All Rows",
        code: "UPDATE users SET active = 1;",
        description: "Update all rows (use carefully!)",
      },
    ],
    tips: [
      "Always use WHERE clause to avoid updating all rows!",
      "Test with SELECT first to verify condition",
      "Can update multiple columns in one statement",
      "Use = for assignment, not ==",
    ],
  },

  DELETE: {
    title: "DELETE - Remove Data",
    syntax: `DELETE FROM table_name
WHERE condition;`,
    examples: [
      {
        label: "Delete Specific Rows",
        code: "DELETE FROM users WHERE age < 18;",
        description: "Remove users under 18",
      },
      {
        label: "Delete Single Row",
        code: "DELETE FROM users WHERE id = 10;",
        description: "Delete specific user by ID",
      },
      {
        label: "Delete All Rows",
        code: "DELETE FROM users;",
        description: "Remove all rows (use with caution!)",
      },
    ],
    tips: [
      "ALWAYS use WHERE clause unless you want to delete everything!",
      "Test with SELECT first to verify what will be deleted",
      "DELETE removes rows, not the table structure",
      "Consider using TRUNCATE for clearing all data (faster)",
    ],
  },

  JOIN: {
    title: "JOIN - Combine Tables",
    syntax: `SELECT columns
FROM table1
[INNER|LEFT|RIGHT|FULL] JOIN table2
ON table1.column = table2.column;`,
    examples: [
      {
        label: "INNER JOIN",
        code: "SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id;",
        description: "Get users with their orders (matching rows only)",
      },
      {
        label: "LEFT JOIN",
        code: "SELECT users.name, orders.total FROM users LEFT JOIN orders ON users.id = orders.user_id;",
        description: "Get all users, with orders if available",
      },
      {
        label: "Multiple JOINs",
        code: "SELECT u.name, o.total, p.name FROM users u JOIN orders o ON u.id = o.user_id JOIN products p ON o.product_id = p.id;",
        description: "Join multiple tables together",
      },
    ],
    tips: [
      "INNER JOIN: only matching rows",
      "LEFT JOIN: all from left + matching from right",
      "RIGHT JOIN: all from right + matching from left",
      "Use table aliases (AS) for shorter code",
    ],
  },

  CREATE: {
    title: "CREATE TABLE - Define Structure",
    syntax: `CREATE TABLE table_name (
  column1 datatype [constraints],
  column2 datatype [constraints],
  ...
);`,
    examples: [
      {
        label: "Basic Table",
        code: "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);",
        description: "Create simple products table",
      },
      {
        label: "Table with Constraints",
        code: "CREATE TABLE employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE, age INTEGER CHECK(age >= 18));",
        description: "Table with various constraints",
      },
      {
        label: "Table with Foreign Key",
        code: "CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, FOREIGN KEY(user_id) REFERENCES users(id));",
        description: "Table with relationship to users",
      },
    ],
    tips: [
      "PRIMARY KEY uniquely identifies each row",
      "NOT NULL prevents empty values",
      "UNIQUE ensures no duplicate values",
      "CHECK validates data on insert/update",
    ],
  },

  AGGREGATE: {
    title: "Aggregate Functions",
    syntax: `SELECT 
  COUNT(*), 
  SUM(column), 
  AVG(column),
  MAX(column), 
  MIN(column)
FROM table_name
GROUP BY column;`,
    examples: [
      {
        label: "COUNT Rows",
        code: "SELECT COUNT(*) as total FROM users;",
        description: "Count total number of users",
      },
      {
        label: "SUM and AVG",
        code: "SELECT SUM(total) as revenue, AVG(total) as avg_order FROM orders;",
        description: "Calculate total and average order value",
      },
      {
        label: "GROUP BY with Aggregate",
        code: "SELECT country, COUNT(*) as users FROM users GROUP BY country;",
        description: "Count users per country",
      },
      {
        label: "MAX and MIN",
        code: "SELECT MAX(age) as oldest, MIN(age) as youngest FROM users;",
        description: "Find age range",
      },
    ],
    tips: [
      "COUNT(*) counts all rows including NULL",
      "COUNT(column) counts non-NULL values only",
      "Use AS to name result columns",
      "Combine with GROUP BY for category totals",
    ],
  },

  WHERE: {
    title: "WHERE - Filter Conditions",
    syntax: `WHERE column operator value
AND/OR another_condition`,
    examples: [
      {
        label: "Basic Comparison",
        code: "SELECT * FROM users WHERE age >= 21;",
        description: "Users age 21 or older",
      },
      {
        label: "AND / OR",
        code: "SELECT * FROM users WHERE age > 18 AND country = 'USA';",
        description: "Adult users from USA",
      },
      {
        label: "LIKE Pattern",
        code: "SELECT * FROM users WHERE email LIKE '%@gmail.com';",
        description: "Gmail users (% is wildcard)",
      },
      {
        label: "IN List",
        code: "SELECT * FROM users WHERE country IN ('USA', 'UK', 'Canada');",
        description: "Users from specific countries",
      },
      {
        label: "BETWEEN Range",
        code: "SELECT * FROM products WHERE price BETWEEN 10 AND 50;",
        description: "Products in price range",
      },
    ],
    tips: [
      "Operators: =, !=, <, >, <=, >=",
      "LIKE: % matches any characters, _ matches one character",
      "IN checks against a list of values",
      "BETWEEN is inclusive (includes both ends)",
      "Use AND for both conditions, OR for either",
    ],
  },
  DROP: {
    title: "DROP TABLE - Remove Table",
    syntax: `DROP TABLE table_name;`,
    examples: [
      {
        label: "Drop Table",
        code: "DROP TABLE users;",
        description: "Permanently remove users table and all its data",
      },
    ],
    tips: [
      "This action is irreversible!",
      "Use with caution, especially in production environments",
      "Consider backing up data before dropping tables",
    ],
  },
  ALTER: {
    title: "ALTER TABLE - Modify Structure",
    syntax: `ALTER TABLE table_name
ADD column_name datatype;
ALTER TABLE table_name
DROP COLUMN column_name;
ALTER TABLE table_name
RENAME TO new_table_name;`,
    examples: [
      {
        label: "Add Column",
        code: "ALTER TABLE users ADD COLUMN last_login DATETIME;",
        description: "Add new column to existing table",
      },
      {
        label: "Drop Column",
        code: "ALTER TABLE users DROP COLUMN last_login;",
        description:
          "Remove column from table (not supported in all databases)",
      },
      {
        label: "Rename Table",
        code: "ALTER TABLE users RENAME TO customers;",
        description: "Change table name",
      },
    ],
    tips: [
      "Adding columns is generally safe",
      "Dropping columns may lead to data loss (not supported in all databases)",
      "Renaming tables can break existing queries, use with caution",
    ],
  },
  INDEX: {
    title: "CREATE INDEX - Speed Up Queries",
    syntax: `CREATE INDEX index_name ON table_name (column_name);`,
    examples: [
      {
        label: "Create Index",
        code: "CREATE INDEX idx_users_email ON users (email);",
        description: "Create index on email column to speed up searches",
      },
    ],
    tips: [
      "Indexes improve query performance but can slow down inserts/updates",
      "Use indexes on columns that are frequently searched or used in JOINs",
      "Avoid over-indexing, which can degrade performance",
    ],
  },
  VIEW: {
    title: "CREATE VIEW - Virtual Table",
    syntax: `CREATE VIEW view_name AS
SELECT columns
FROM table_name
WHERE condition;`,
    examples: [
      {
        label: "Create View",
        code: "CREATE VIEW active_users AS SELECT * FROM users WHERE active = 1;",
        description: "Create a view for active users",
      },
    ],
    tips: [
      "Views are virtual tables based on the result of a query",
      "They can simplify complex queries and improve readability",
      "Views do not store data themselves, they query the underlying tables",
    ],
  },
};

export const HELP_CATEGORIES = [
  { id: "SELECT", label: "SELECT", icon: "search" },
  { id: "INSERT", label: "INSERT", icon: "add_circle" },
  { id: "UPDATE", label: "UPDATE", icon: "edit" },
  { id: "DELETE", label: "DELETE", icon: "delete" },
  { id: "JOIN", label: "JOIN", icon: "merge" },
  { id: "CREATE", label: "CREATE TABLE", icon: "table_chart" },
  { id: "AGGREGATE", label: "Aggregate Functions", icon: "functions" },
  { id: "WHERE", label: "WHERE", icon: "filter_alt" },
  { id: "DROP", label: "DROP TABLE", icon: "delete_forever" },
  { id: "ALTER", label: "ALTER TABLE", icon: "build" },
  { id: "INDEX", label: "CREATE INDEX", icon: "speed" },
  { id: "VIEW", label: "CREATE VIEW", icon: "visibility" },
];
