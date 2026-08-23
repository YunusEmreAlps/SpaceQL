/**
 * SQL Query Parser
 * Regex-based parser — no external SQL library, runs in browser
 * 
 * Returns a structured ParseResult that the visualizer dispatcher consumes.
 */

const PATTERNS = {
  // SELECT patterns
  select:       /SELECT\s+(DISTINCT\s+)?(.+?)\s+FROM\s+(\w+)/i,
  where:        /WHERE\s+(.+?)(?:\bGROUP\s+BY\b|\bORDER\s+BY\b|\bLIMIT\b|\bHAVING\b|;|$)/is,
  join:         /(INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN)\s+(\w+)\s+ON\s+(.+?)(?:\bWHERE\b|\bINNER\b|\bLEFT\b|\bRIGHT\b|\bFULL\b|\bCROSS\b|\bJOIN\b|\bGROUP\b|\bORDER\b|\bLIMIT\b|;|$)/gis,
  groupBy:      /GROUP\s+BY\s+(.+?)(?:\bHAVING\b|\bORDER\s+BY\b|\bLIMIT\b|;|$)/is,
  orderBy:      /ORDER\s+BY\s+(.+?)(?:\bLIMIT\b|;|$)/is,
  limit:        /LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/i,
  having:       /HAVING\s+(.+?)(?:\bORDER\s+BY\b|\bLIMIT\b|;|$)/is,
  
  // INSERT patterns
  insert:       /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/is,
  
  // UPDATE patterns
  update:       /UPDATE\s+(\w+)\s+SET\s+(.+?)(?:WHERE|;|$)/is,
  
  // DELETE patterns
  delete:       /DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:;|$)/is,
  
  // DDL patterns
  createTable:  /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^)]+)\)/is,
  dropTable:    /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i,
  alterTable:   /ALTER\s+TABLE\s+(\w+)\s+(.+)/is,
  
  // Aggregate functions
  aggregate:    /(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*(.+?)\s*\)/gis,
  
  // Subquery
  subquery:     /\(SELECT\s+.+?\)/is,
};

// SQL data types
const SQL_TYPES = new Set([
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT',
  'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT',
  'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR',
  'BOOLEAN', 'BOOL',
  'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC',
  'BLOB', 'BINARY', 'VARBINARY'
]);

const INT_LITERAL  = /^-?\d+$/;
const FLOAT_LITERAL = /^-?\d+\.\d+$/;
const STRING_LITERAL = /^['"].*['"]$/;

/**
 * Infer SQL type from a value expression
 */
function inferType(value) {
  if (!value) return 'unknown';
  const v = value.trim();
  if (v.toLowerCase() === 'true' || v.toLowerCase() === 'false') return 'BOOLEAN';
  if (INT_LITERAL.test(v)) return 'INTEGER';
  if (FLOAT_LITERAL.test(v)) return 'FLOAT';
  if (STRING_LITERAL.test(v)) return 'VARCHAR';
  if (v.toLowerCase() === 'null') return 'NULL';
  return 'unknown';
}

/**
 * Parse column definitions from CREATE TABLE
 */
function parseColumnDefs(defsStr) {
  const cols = [];
  const parts = defsStr.split(',').map(s => s.trim());
  
  for (const part of parts) {
    // Match: column_name TYPE(size) constraints
    const match = part.match(/(\w+)\s+(\w+)(?:\((\d+)\))?(?:\s+(PRIMARY\s+KEY|NOT\s+NULL|UNIQUE|AUTO_INCREMENT|DEFAULT\s+.+))?/i);
    if (match) {
      const [, name, type, size, constraint] = match;
      cols.push({ 
        name, 
        type: type.toUpperCase(), 
        size: size ? parseInt(size) : null, 
        constraint: constraint ? constraint.toUpperCase() : null 
      });
    }
  }
  
  return cols;
}

/**
 * Parse column list (e.g., "id, name, email" or "*, COUNT(*)")
 */
function parseColumns(colStr) {
  const cols = colStr.split(',').map(c => {
    const trimmed = c.trim();
    
    // Handle aliases (e.g., "name AS full_name")
    const aliasMatch = trimmed.match(/(.+?)\s+AS\s+(\w+)/i);
    if (aliasMatch) {
      return { expr: aliasMatch[1].trim(), alias: aliasMatch[2], raw: trimmed };
    }
    
    return { expr: trimmed, alias: null, raw: trimmed };
  });
  
  return cols;
}

/**
 * Parse WHERE conditions
 */
function parseConditions(whereStr) {
  if (!whereStr) return [];
  
  const conditions = [];
  // Split by AND/OR but keep the operators
  const parts = whereStr.split(/\s+(AND|OR)\s+/i);
  
  let currentOp = null;
  for (const part of parts) {
    if (part.match(/^(AND|OR)$/i)) {
      currentOp = part.toUpperCase();
      continue;
    }
    
    // Match various condition patterns
    const opMatch = part.match(/(\w+(?:\.\w+)?)\s*(=|!=|<>|>|<|>=|<=|LIKE|IN|NOT\s+IN|IS\s+NULL|IS\s+NOT\s+NULL|BETWEEN)\s*(.+)?/i);
    if (opMatch) {
      const [, left, op, right] = opMatch;
      conditions.push({ 
        left: left.trim(), 
        operator: op.toUpperCase(), 
        right: right ? right.trim() : null,
        logicalOp: currentOp
      });
      currentOp = null;
    }
  }
  
  return conditions;
}

/**
 * Parse JOIN clause
 */
function parseJoins(code) {
  const joins = [];
  const joinMatches = [...code.matchAll(PATTERNS.join)];
  
  for (const match of joinMatches) {
    const [, joinType, table, condition] = match;
    joins.push({
      type: joinType.toUpperCase().replace(/\s+/g, '_'),
      table,
      on: condition.trim()
    });
  }
  
  return joins;
}

/**
 * Parse SELECT query
 */
function parseSelectQuery(code, result) {
  const selectMatch = code.match(PATTERNS.select);
  if (!selectMatch) return;
  
  const [, distinct, columns, table] = selectMatch;
  
  result.selects.push({
    distinct: !!distinct,
    columns: parseColumns(columns),
    from: table,
    where: null,
    joins: [],
    groupBy: null,
    having: null,
    orderBy: null,
    limit: null
  });
  
  const query = result.selects[0];
  
  // Parse WHERE
  const whereMatch = code.match(PATTERNS.where);
  if (whereMatch) {
    query.where = parseConditions(whereMatch[1]);
  }
  
  // Parse JOINs
  query.joins = parseJoins(code);
  
  // Parse GROUP BY
  const groupMatch = code.match(PATTERNS.groupBy);
  if (groupMatch) {
    query.groupBy = groupMatch[1].split(',').map(c => c.trim());
  }
  
  // Parse HAVING
  const havingMatch = code.match(PATTERNS.having);
  if (havingMatch) {
    query.having = parseConditions(havingMatch[1]);
  }
  
  // Parse ORDER BY
  const orderMatch = code.match(PATTERNS.orderBy);
  if (orderMatch) {
    query.orderBy = orderMatch[1].split(',').map(c => {
      const parts = c.trim().split(/\s+/);
      return { column: parts[0], direction: parts[1] ? parts[1].toUpperCase() : 'ASC' };
    });
  }
  
  // Parse LIMIT
  const limitMatch = code.match(PATTERNS.limit);
  if (limitMatch) {
    query.limit = {
      count: parseInt(limitMatch[1]),
      offset: limitMatch[2] ? parseInt(limitMatch[2]) : 0
    };
  }
  
  // Parse aggregates
  const aggMatches = [...code.matchAll(PATTERNS.aggregate)];
  for (const match of aggMatches) {
    result.aggregates.push({
      function: match[1].toUpperCase(),
      expression: match[2].trim()
    });
  }
}

/**
 * Parse INSERT query
 */
function parseInsertQuery(code, result) {
  const insertMatch = code.match(PATTERNS.insert);
  if (!insertMatch) return;
  
  const [, table, columns, values] = insertMatch;
  
  result.inserts.push({
    table,
    columns: columns.split(',').map(c => c.trim()),
    values: values.split(',').map(v => v.trim())
  });
}

/**
 * Parse UPDATE query
 */
function parseUpdateQuery(code, result) {
  const updateMatch = code.match(PATTERNS.update);
  if (!updateMatch) return;
  
  const [, table, setClause] = updateMatch;
  
  // Parse SET clause
  const assignments = setClause.split(',').map(s => {
    const [col, val] = s.split('=').map(x => x.trim());
    return { column: col, value: val };
  });
  
  // Parse WHERE
  const whereMatch = code.match(PATTERNS.where);
  
  result.updates.push({
    table,
    set: assignments,
    where: whereMatch ? parseConditions(whereMatch[1]) : null
  });
}

/**
 * Parse DELETE query
 */
function parseDeleteQuery(code, result) {
  const deleteMatch = code.match(PATTERNS.delete);
  if (!deleteMatch) return;
  
  const [, table, whereClause] = deleteMatch;
  
  result.deletes.push({
    table,
    where: whereClause ? parseConditions(whereClause) : null
  });
}

/**
 * Parse CREATE TABLE query
 */
function parseCreateQuery(code, result) {
  const createMatch = code.match(PATTERNS.createTable);
  if (!createMatch) return;
  
  const [, table, columnDefs] = createMatch;
  
  result.creates.push({
    table,
    columns: parseColumnDefs(columnDefs)
  });
}

/**
 * Parse DROP TABLE query
 */
function parseDropQuery(code, result) {
  const dropMatch = code.match(PATTERNS.dropTable);
  if (!dropMatch) return;
  
  result.drops.push({
    table: dropMatch[1]
  });
}

/**
 * Parse ALTER TABLE query
 */
function parseAlterQuery(code, result) {
  const alterMatch = code.match(PATTERNS.alterTable);
  if (!alterMatch) return;
  
  const [, table, action] = alterMatch;
  
  result.alters.push({
    table,
    action: action.trim()
  });
}

/**
 * Main parser function - exports parseSQL (previously parseGo)
 * @param {string} code - SQL query code
 * @returns {ParseResult}
 */
export function parseSQL(code) {
  try {
    const normalizedCode = code.trim();

    const result = {
      type:         'unknown',
      selects:      [],
      inserts:      [],
      updates:      [],
      deletes:      [],
      creates:      [],
      drops:        [],
      alters:       [],
      joins:        [],
      aggregates:   [],
      subqueries:   [],
      raw:          code,
    };

    // Detect query type
    const upperCode = normalizedCode.toUpperCase();
    
    if (upperCode.startsWith('SELECT')) {
      result.type = 'SELECT';
      parseSelectQuery(normalizedCode, result);
    } else if (upperCode.startsWith('INSERT')) {
      result.type = 'INSERT';
      parseInsertQuery(normalizedCode, result);
    } else if (upperCode.startsWith('UPDATE')) {
      result.type = 'UPDATE';
      parseUpdateQuery(normalizedCode, result);
    } else if (upperCode.startsWith('DELETE')) {
      result.type = 'DELETE';
      parseDeleteQuery(normalizedCode, result);
    } else if (upperCode.startsWith('CREATE TABLE')) {
      result.type = 'CREATE';
      parseCreateQuery(normalizedCode, result);
    } else if (upperCode.startsWith('DROP TABLE')) {
      result.type = 'DROP';
      parseDropQuery(normalizedCode, result);
    } else if (upperCode.startsWith('ALTER TABLE')) {
      result.type = 'ALTER';
      parseAlterQuery(normalizedCode, result);
    }

    return result;
  } catch (e) {
    console.error('[Parser] SQL parsing failed:', e);
    return {
      type: 'error',
      error: e.message,
      raw: code,
      selects: [],
      inserts: [],
      updates: [],
      deletes: [],
      creates: [],
      drops: [],
      alters: [],
      joins: [],
      aggregates: [],
      subqueries: []
    };
  }
}

// Keep backward compatibility - export as parseGo too (for existing code)
export const parseGo = parseSQL;
