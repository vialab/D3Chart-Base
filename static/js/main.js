var chartObj;
var leadChart;
$(function () {

	$('#newsearch').submit(function (event) {
		event.stopPropagation();
		event.preventDefault();
		postJSON('/query-dimensions', {query: document.getElementById('query-field').value}, function (result) {
			console.log(result);
			// result.lines[0].rawdata.push(
			// 	// {x: 2020, y: 0.0000304810305345002}
			// 	{
			// 		x: 2020,
			// 		y: Math.random() / 2000
			// 	}
			// );
			var today = new Date();

			var xmax = new Date(today.getFullYear() + 1, 0);
			var xmin = new Date(1970, 0);

			// chartObj.smoothing = 8;
			// chartObj.updateXScale(xmin,xmax);

			chartObj.updateLines(result.lines);
		});

	});


	// Create chart on page & data load.
	postJSON('unigramdata', {}, function (result) {
		// console.log(result)

		chartObj = new D3Chart('#ngramchart', true);

		if (result.xdomain) {
			var xmin = new Date(result.xdomain[0], 0);
			var xmax = new Date(result.xdomain[1], 0);
		}

		chartObj.updateXScale(xmin, xmax);
		chartObj.updateYScale(0, 100);



		//chartObj.updateLines(null);
//
		//let yearlead = leadlag(result.lines[0].rawdata, result.lines[1].rawdata) + 1; // always seems to be 1 off. 
//
		//console.log('Test0 Leads Test1 by ', yearlead, 'years');
//
		//leadChart = new D3Chart('#leadlag', true);
		//leadChart.updateXScale(xmin, xmax);
		//leadChart.updateYScale(-0.0005, 0.0005);
		//// leadChart.updateYScale(result.ydomain[0], result.ydomain[1]);
		//leadChart.updateLines(result.lines);


	});


});