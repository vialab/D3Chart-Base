const Pool = require("pg").Pool;
const credentials = require("./dimensionsmetricscreds.json");
const pool = new Pool(credentials);

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

const createTable = async (request, response) => {
  let query = request.body;
  if (!query.hasOwnProperty("name") || !query.hasOwnProperty("columns")) {
    response.status(400);
    return;
  }
  let queryString = "CREATE TABLE ";
  queryString += query.name + "(";
  for (let i = 0; i < query.columns; ++i) {
    queryString += query.columns[i].name + " ";
    queryString += query.columns[i].type;
    if (query.columns[i].hasOwnProperty("contraints")) {
      queryString += " " + query.columns[i].constraints + ",";
    } else {
      queryString += ",";
    }
  }
  queryString = queryString.slice(0, -1);
  queryString += ");";
  pool.query(queryString, (err, results) => {
    if (err) {
      console.error(err);
      throw err;
    }
    response.status(200).json(results.rows);
  });
};

const listTables = async (request, response) => {
  pool.query(
    `SELECT * FROM pg_catalog.pg_tables where schemaname != 'pg_catalog' AND schemaname != "information_schema";`,
    (err, results) => {
      if (err) {
        console.error(err);
        throw err;
      }
      console.log(results);
      response.status(200).json(results);
    }
  );
};

module.exports = { createTable, listTables };
