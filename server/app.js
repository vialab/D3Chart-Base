require("dotenv").config();
const express = require("express");
const port = 3000;
const app = express();

app.use(express.static(`${__dirname}/../static`));

require(`./routes.js`)(app);

app.listen(port);
console.log(`Web server listening on port ${port}`);
