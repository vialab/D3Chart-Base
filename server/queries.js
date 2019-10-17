//https://docs.dimensions.ai/dsl/
const request = require("request");
const callLimit = require("./apicallrestrict");
const lastAuthorization = require("../lastauthorization.json");
const fs = require("fs");
//use the exampleconfiglogin and input your credentials there
const login = require("./configlogin.json");
//var jwt_token;
var api_url_auth = "https://app.dimensions.ai/api/auth.json";
var api_url = "https://app.dimensions.ai/api/dsl.json";

let jwt_token = require("../credentials.json");
//const institutes = require("../institutes.json");

console.log(jwt_token);
//keeps track of the usage and restricts if we are approaching the limit
var timer = new callLimit();
/**
 * @param  {JSON} date - JSON object containing date
 * @returns {boolean} - returns false if authorization has not expired, returns true if it has expired and writes to file the current date(it assumes one will get new credentials immediately)
 */
function authorizationExpiration(date) {
  date = new Date(date);
  let oneDay = 60 * 60 * 1000 * 24;
  if (new Date() - date > oneDay) {
    fs.writeFile(
      "./lastauthorization.json",
      JSON.stringify(new Date().toJSON()),
      err => {
        console.error(err);
      }
    );
    return true;
  }
  return false;
}

if (authorizationExpiration(lastAuthorization)) {
  console.log("Getting authorization tokens");
  //get credentials
  request.post(api_url_auth, function(error, resp) {
    if (error) {
      throw error;
    }
    let cacheToken = JSON.parse(resp.body).token;
    if (cacheToken != null) {
      jwt_token = { Authorization: "JWT " + cacheToken };
      fs.writeFile("./credentials.json", JSON.stringify(jwt_token), err => {
        console.error(err);
      });
    } else {
      console.log("Error getting token.");
    }
  }).body = JSON.stringify(login);
}

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

function sleepFor(sleepDuration) {
  var now = new Date().getTime();
  while (new Date().getTime() < now + sleepDuration) {
    /* do nothing */
  }
}

// const options = {
//   url: api_url,
//   method: "POST",
//   headers: {
//     Authorization: jwt_token.Authorization
//   },
//   body: `search grants where research_orgs.name!="Canada" and active_year=2017 and FOR.name="0604 Genetics" return FOR aggregate funding`
// };

// request.post(options, (error, res) => {
//   if (error) {
//     console.log(error);
//     throw error;
//   }
//   console.log(res.body);
// });

module.exports = queryDimensions;
