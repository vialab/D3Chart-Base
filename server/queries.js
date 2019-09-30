//https://docs.dimensions.ai/dsl/
const request = require("request");
const callLimit = require("./apicallrestrict");
//use the exampleconfiglogin and input your credentials there
const login = require("./configlogin.json");
var jwt_token;
var api_url_auth = "https://app.dimensions.ai/api/auth.json";
var api_url = "https://app.dimensions.ai/api/dsl.json";

//keeps track of the usage and restricts if we are approaching the limit
var timer = new callLimit();
//get credentials
request.post(api_url_auth, function(error, resp) {
  if (error) {
    throw error;
  }
  let cacheToken = JSON.parse(resp.body).token;
  if (cacheToken != null) {
    jwt_token = { Authorization: "JWT " + cacheToken };
  } else {
    console.log("Error getting token.");
  }
}).body = JSON.stringify(login);

//main query call for the dataset
/**
 * @param  {JSON} req - format {query:}
 * @param  {} resp
 */
const queryDimensions = async (req, resp) => {
  if (timer.incrementCalls()) {
    console.log(req.body.query);
    const options = {
      url: api_url,
      method: "POST",
      headers: {
        Authorization: jwt_token.Authorization
      },
      body: req.body.query
    };

    request.post(options, (error, res) => {
      if (error) {
        console.log(error);
        throw error;
      }
      resp.send(res);
    });
  } else {
    console.log("Reached API limit");
  }
};

module.exports = queryDimensions;

///////////////////////////////Query//////////////////////
//research_orgs.country_name="Gambia"====country tag/////
