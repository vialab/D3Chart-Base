const institutesGeoLocation = require("../institution-geolocations.json");

const getLocation = function(grid_id) {
  if (grid_id in institutesGeoLocation) {
    return institutesGeoLocation[grid_id];
  } else {
    console.error(
      `grid_id of ${grid_id} not contained in institutes geo locations`
    );
    return { lat: null, lng: null };
  }
};

const getLocations = async function(req, res) {
  if (!("grid_ids" in req.body)) {
    console.error("missing grid_ids");
    res.status(400);
    return;
  }
  let result = [];
  let grid_ids = req.body.grid_ids;
  for (let i = 0; i < grid_ids.length; ++i) {
    result.push(getLocation(grid_ids[i]));
  }

  res.status(200).send(JSON.stringify(result));
};

module.exports = { getLocations };
