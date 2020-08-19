const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_CONN_STRING,
});
/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const search = async (req, res) => {
  console.log(req.body);
  const term = req.body.term;
  if (!term) {
    res.send({});
    return;
  }
  let result = await pool.query(
    "SELECT count(*), year FROM erudit_text INNER JOIN erudit_meta ON erudit_text.id = erudit_meta.id WHERE sent_map ? $1 GROUP BY year;",
    [term]
  );
  res.send(result.rows);
  return;
};
/**
 * @param {Request} req
 * @param {Response} res
 * @returns {Object.<string,number>} keys are the years, the value is the total number of texts for that year in the erudit dataset
 */
const loadYearTotals = async (req, res) => {
  let result = await pool.query(
    "SELECT year, count(*) FROM erudit_meta GROUP BY year"
  );
  let yearObj = {};
  for (const x of result.rows) {
    yearObj[x.year] = x.count;
  }
  res.send(yearObj);
  return;
};

module.exports = { search, loadYearTotals };
