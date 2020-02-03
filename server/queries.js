//https://docs.dimensions.ai/dsl/
const request = require("request");
const callLimit = require("./apicallrestrict");
const lastAuthorization = require("./resources/lastauthorization.json");
const fs = require("fs");
//use the exampleconfiglogin and input your credentials there
const login = require("./resources/configlogin.json");
//var jwt_token;
var api_url_auth = "https://app.dimensions.ai/api/auth.json";
var api_url = "https://app.dimensions.ai/api/dsl.json";

let jwt_token = require("./resources/credentials.json");

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
      "./server/resources/lastauthorization.json",
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
      fs.writeFile(
        "./server/resources/credentials.json",
        JSON.stringify(jwt_token),
        err => {
          console.error(err);
        }
      );
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
  timer.incrementCalls();
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
};

function sleepFor(sleepDuration) {
  var now = new Date().getTime();
  while (new Date().getTime() < now + sleepDuration) {
    /* do nothing */
  }
}

const queryNotCanada = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names!="Canada" and year=${req.body.year} return research_orgs limit 1000`
  };
  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }

    console.log(res.body);
    resp.status(200).send(res);
  });
};

const queryCanada = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names="Canada" and year=${req.body.year} return research_orgs limit 1000`
  };

  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res.body);
    resp.status(200).send(res);
  });
};

const queryCategory = async function(req, resp) {
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names="${req.body.country_name}" and year=${req.body.year} return category_for limit 1000`
  };
  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }

    console.log(res.body);
    resp.status(200).send(res);
  });
};

const queryInstituteCitationsCan = async function(req, resp) {
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names="${req.body.country_name}" and year=${req.body.year} return publications[research_orgs + times_cited] limit 1000`
  };
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};
const queryInstituteCitationsNotCan = async function(req, resp) {
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search publications for "${req.body.keyword}" where research_org_country_names!="${req.body.country_name}" and year=${req.body.year} return publications[research_orgs + times_cited] limit 1000`
  };
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};

const queryCanadaFunding = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search grants for "${req.body.keyword}" where research_org_countries.name="Canada" and active_year=${req.body.year} return research_orgs aggregate funding limit 1000`
  };

  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};
const queryFunding = async function(req, resp) {
  if (!("keyword" in req.body) && !("year" in req.body)) {
    resp.status(400).send({ error: "Must contain keyword and year" });
    return;
  }
  timer.incrementCalls();
  const options = {
    url: api_url,
    method: "POST",
    headers: {
      Authorization: jwt_token.Authorization
    },
    body: `search grants for "${req.body.keyword}" where research_org_countries.name!="Canada" and active_year=${req.body.year} return research_orgs aggregate funding limit 1000`
  };

  console.log(options);
  request.post(options, (error, res) => {
    if (error) {
      console.log(error);
    }
    console.log(res);
    resp.status(200).send(res);
  });
};

module.exports = {
  queryDimensions,
  queryNotCanada,
  queryCanada,
  queryCategory,
  queryInstituteCitationsCan,
  queryInstituteCitationsNotCan,
  queryCanadaFunding,
  queryFunding
};
