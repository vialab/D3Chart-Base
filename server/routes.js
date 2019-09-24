const bodyParser = require("body-parser");
const queryDimensions = require("./queries");

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
        res.json({test:1});
    });

    app.post("/query-dimensions", queryDimensions);
}