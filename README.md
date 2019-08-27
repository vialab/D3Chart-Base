# D3Chart-Base
Mostly a Javascript class wrapping/abstracting D3 V5 code to create a general purpose chart.

Specifically the JavaScript class to handle it all is `ngram_viewer/static/js/ngram.js`. That class is used in 'main.js'.

 I also implemented the algorithm from the 'whom leads who' lead-lag paper, find it's implementation in 'leadlag.js' and it being used in 'main.js'.



## Running the Demo

* To run the demo, ensure `flask` for python 3.7 is installed in your python environment
* From that python environment, run `flask run` 
* Navigate to [localhost:5000](http://localhost:5000)
* Open developer tools to view console output and svg structure