const bodyParser = require("body-parser");
const queryDimensions = require("./queries");
const defaultData = require("./defaultData.json");

module.exports =app=>
{
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.get("/", (req, res)=>
    {
        console.log(__dirname + '/..');
        res.sendFile("./static/ngram.html", {root: __dirname+"/.."});
    });

    app.post("/unigramdata", (req, res)=>{
        console.log('request for unigram data');
    });

    app.post("/query-dimensions", queryDimensions);

    app.post("/default-view", (req, res)=>
    {
        res.json(defaultData);
    });
}