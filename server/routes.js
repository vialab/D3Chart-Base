const bodyParser = require("body-parser");
const queryDimensions = require("./queries");
const defaultData = require("./resources/defaultData.json");
const locations = require("./geolocation");
//const metricsDB = require("./metricsdb");

module.exports = app => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    console.log(__dirname + "/..");
    res.sendFile("./static/index.html", { root: __dirname + "/.." });
  });

  app.get("/graphs", (req, res) => {
    console.log(__dirname + "/..");
    res.sendFile("./static/ngram.html", { root: __dirname + "/.." });
  });

  app.post("/unigramdata", (req, res) => {
    console.log("request for unigram data");
  });

  app.post("/querycategories", queryDimensions.queryCategory);

  app.post("/query-dimensions", queryDimensions.queryDimensions);

  app.post("/geo-locations", locations.getLocations);

  app.post("/querynotcanada", queryDimensions.queryNotCanada);

  app.post("/querycanada", queryDimensions.queryCanada);

  app.post("/institute-citations", queryDimensions.queryInstituteCitationsCan);

  app.post(
    "/institute-citations-not",
    queryDimensions.queryInstituteCitationsNotCan
  );

  app.post("/funding-can", queryDimensions.queryCanadaFunding);

  app.post("/funding", queryDimensions.queryFunding);

  app.post("/recommended-list", queryDimensions.recommendedList);

  app.post("/get-recommended-list", queryDimensions.getRecommendedList);

  app.post("/default-view", (req, res) => {
    res.json(defaultData);
  });
};
