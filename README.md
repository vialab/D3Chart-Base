# LeadLag-Chart

Mostly a Javascript class wrapping/abstracting D3 V5 code to create a general purpose chart.

Specifically the JavaScript class to handle it all is `ngram_viewer/static/js/ngram.js`. That class is used in 'main.js'.

I also implemented the algorithm from the 'whom leads who' lead-lag paper, find it's implementation in 'leadlag.js' and it being used in 'main.js'.

## Installing

1. run the [npm install command](https://docs.npmjs.com/cli/install)
2. rename exampleconfiglogin.json to configlogin.json and add your [Dimensions.ai API credentials](https://www.dimensions.ai/dimensions-apis/) to the file. The file is located in the server directory.
3. npm start will launch nodemon listening on port 3000
4. go to localhost:3000

## Dependencies

- [nodemon "^1.19.2"](https://www.npmjs.com/package/nodemon)
- [body-parser "^1.19.0"](https://www.npmjs.com/package/body-parser)
- [express "^4.17.1"](https://www.npmjs.com/package/express)
- [request "^2.88.0"](https://www.npmjs.com/package/request)
- [pg "^7.12.1"](https://www.npmjs.com/package/pg)

## Contributors

- Adam Bradley PhD, Research Lead
- Chris Collins PhD, Research Supervisor
- Nathan Beals, Software Developer
- Zachary Hills MsC, Software Developer
