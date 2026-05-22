// SQL autocompletion suggestions for Monaco Editor
export function getSuggestions(monaco) {
  return [
    // SELECT Keywords
    {
      label: "SELECT",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "SELECT ${1:columns} FROM ${2:table}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Query data from a table"
    },
    {
      label: "SELECT DISTINCT",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "SELECT DISTINCT ${1:column} FROM ${2:table}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Query unique values"
    },
    {
      label: "SELECT * FROM",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT * FROM ${1:table}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Select all columns from a table"
    },
    {
      label: "SELECT with WHERE",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT ${1:columns} FROM ${2:table} WHERE ${3:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Query with filtering"
    },
    {
      label: "SELECT with JOIN",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT ${1:columns}\nFROM ${2:table1}\nJOIN ${3:table2} ON ${4:table1.id = table2.id}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Query with join"
    },
    
    // INSERT Keywords
    {
      label: "INSERT INTO",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "INSERT INTO ${1:table} (${2:columns}) VALUES (${3:values})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Insert data into a table"
    },
    
    // UPDATE Keywords
    {
      label: "UPDATE",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "UPDATE ${1:table} SET ${2:column} = ${3:value} WHERE ${4:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Update data in a table"
    },
    
    // DELETE Keywords
    {
      label: "DELETE FROM",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "DELETE FROM ${1:table} WHERE ${2:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Delete data from a table"
    },
    
    // CREATE Keywords
    {
      label: "CREATE TABLE",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "CREATE TABLE ${1:table_name} (\n\t${2:column1} ${3:type},\n\t${4:column2} ${5:type}\n)",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Create a new table"
    },
    {
      label: "CREATE TABLE with PRIMARY KEY",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "CREATE TABLE ${1:table_name} (\n\tid INT PRIMARY KEY AUTO_INCREMENT,\n\t${2:column} ${3:VARCHAR(255)}\n)",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Create table with primary key"
    },
    
    // DROP Keywords
    {
      label: "DROP TABLE",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "DROP TABLE IF EXISTS ${1:table}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Drop a table"
    },
    
    // JOIN Keywords
    {
      label: "INNER JOIN",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "INNER JOIN ${1:table} ON ${2:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Inner join two tables"
    },
    {
      label: "LEFT JOIN",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "LEFT JOIN ${1:table} ON ${2:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Left outer join"
    },
    {
      label: "RIGHT JOIN",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "RIGHT JOIN ${1:table} ON ${2:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Right outer join"
    },
    
    // WHERE Keywords
    {
      label: "WHERE",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "WHERE ${1:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Filter results"
    },
    
    // GROUP BY Keywords
    {
      label: "GROUP BY",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "GROUP BY ${1:column}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Group results"
    },
    {
      label: "GROUP BY with HAVING",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "GROUP BY ${1:column} HAVING ${2:condition}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Group with filter"
    },
    
    // ORDER BY Keywords
    {
      label: "ORDER BY",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "ORDER BY ${1:column} ${2:ASC}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Sort results"
    },
    {
      label: "ORDER BY DESC",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "ORDER BY ${1:column} DESC",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Sort descending"
    },
    
    // LIMIT Keywords
    {
      label: "LIMIT",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "LIMIT ${1:10}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Limit number of results"
    },
    {
      label: "LIMIT with OFFSET",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "LIMIT ${1:10} OFFSET ${2:0}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Pagination"
    },
    
    // Aggregate Functions
    {
      label: "COUNT",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "COUNT(${1:*})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Count rows"
    },
    {
      label: "SUM",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "SUM(${1:column})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Sum values"
    },
    {
      label: "AVG",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "AVG(${1:column})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Average value"
    },
    {
      label: "MAX",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "MAX(${1:column})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Maximum value"
    },
    {
      label: "MIN",
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "MIN(${1:column})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Minimum value"
    },
    
    // Data Types
    {
      label: "INT",
      kind: monaco.languages.CompletionItemKind.TypeParameter,
      insertText: "INT",
      documentation: "Integer type"
    },
    {
      label: "VARCHAR",
      kind: monaco.languages.CompletionItemKind.TypeParameter,
      insertText: "VARCHAR(${1:255})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Variable-length string"
    },
    {
      label: "TEXT",
      kind: monaco.languages.CompletionItemKind.TypeParameter,
      insertText: "TEXT",
      documentation: "Long text"
    },
    {
      label: "DATE",
      kind: monaco.languages.CompletionItemKind.TypeParameter,
      insertText: "DATE",
      documentation: "Date type"
    },
    {
      label: "DATETIME",
      kind: monaco.languages.CompletionItemKind.TypeParameter,
      insertText: "DATETIME",
      documentation: "Date and time"
    },
    {
      label: "BOOLEAN",
      kind: monaco.languages.CompletionItemKind.TypeParameter,
      insertText: "BOOLEAN",
      documentation: "Boolean type"
    },
    {
      label: "FLOAT",
      kind: monaco.languages.CompletionItemKind.TypeParameter,
      insertText: "FLOAT",
      documentation: "Floating point number"
    },
    
    // Constraints
    {
      label: "PRIMARY KEY",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "PRIMARY KEY",
      documentation: "Primary key constraint"
    },
    {
      label: "AUTO_INCREMENT",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "AUTO_INCREMENT",
      documentation: "Auto increment"
    },
    {
      label: "NOT NULL",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "NOT NULL",
      documentation: "Not null constraint"
    },
    {
      label: "UNIQUE",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "UNIQUE",
      documentation: "Unique constraint"
    },
    {
      label: "DEFAULT",
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: "DEFAULT ${1:value}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Default value"
    },
    
    // Operators
    {
      label: "AND",
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: "AND",
      documentation: "Logical AND"
    },
    {
      label: "OR",
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: "OR",
      documentation: "Logical OR"
    },
    {
      label: "LIKE",
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: "LIKE '${1:%pattern%}'",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Pattern matching"
    },
    {
      label: "IN",
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: "IN (${1:values})",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Value in list"
    },
    {
      label: "BETWEEN",
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: "BETWEEN ${1:value1} AND ${2:value2}",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: "Range check"
    },
    {
      label: "IS NULL",
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: "IS NULL",
      documentation: "Check for NULL"
    },
    {
      label: "IS NOT NULL",
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: "IS NOT NULL",
      documentation: "Check for not NULL"
    },
    
    // Common Examples
    {
      label: "Example: SELECT all users",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT * FROM users",
      documentation: "Get all users"
    },
    {
      label: "Example: SELECT with condition",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT name, email FROM users WHERE age > 18",
      documentation: "Get adult users"
    },
    {
      label: "Example: Count users",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT COUNT(*) FROM users",
      documentation: "Count total users"
    },
    {
      label: "Example: Insert new user",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 25)",
      documentation: "Add new user"
    },
    {
      label: "Example: Update user",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "UPDATE users SET email = 'newemail@example.com' WHERE id = 1",
      documentation: "Update user email"
    },
    {
      label: "Example: Delete user",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "DELETE FROM users WHERE id = 1",
      documentation: "Delete user by ID"
    },
    {
      label: "Example: Inner JOIN",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id",
      documentation: "Join users with orders"
    },
    {
      label: "Example: GROUP BY with COUNT",
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: "SELECT city, COUNT(*) as user_count\nFROM users\nGROUP BY city\nORDER BY user_count DESC",
      documentation: "Count users by city"
    },
  ];
}