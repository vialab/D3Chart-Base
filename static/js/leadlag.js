/// Lead/Lag calculation

// Equation (1) from the paper "Who Leads Whom Topical Lead-Lag Analysis across Corpora" is not implemented, because it's a topic aware proportion of documents in the corpus
// this is data we hoped to get rom the dimenions analytics API, since the data coming from the server is random normal distributions, we'll pretend those numbers are n-gram occurence percentages
// E.G: a value of "y=0.00006" where "x=2000" means that for this imaginary n-gram, it occurred 0.00006% of all n-grams for that year, in that corpus.


// Equation (2), 'cross normalized correllation'
function corr(data1, data2, yearOffset) {

	let d1 = key => data1[key] || 0,
		d1Mean = mean(data1),
		d1Variance = mean(data1, key => ((data1[key] - d1Mean) ** 2)),
		d1STD = Math.sqrt(d1Variance),
		d1YearMin = 10000000,
		d1YearMax = -1000000,

		d2 = key => data2[key] || 0,
		d2Mean = mean(data2),
		d2Variance = mean(data2, key => ((data2[key] - d2Mean) ** 2)),
		d2STD = Math.sqrt(d2Variance),
		d2YearMin = 10000000,
		d2YearMax = -1000000;

	for (let key in data1) {
		d1YearMin = Math.min(d1YearMin, key);
		d1YearMax = Math.max(d1YearMax, key);
	}

	for (let key in data2) {
		d2YearMin = Math.min(d2YearMin, key);
		d2YearMax = Math.max(d2YearMax, key);
	}

	let yearMin = Math.min(d1YearMin, d2YearMin),
		yearMax = Math.max(d1YearMax, d2YearMax),
		relation = 0;

	for (let yr = yearMin; yr < yearMax; yr++) {
		relation += ((d1(yr + yearOffset) - d1Mean) / d1STD) * ((d2(yr) - d2Mean) / d2STD);
	}

	return relation;
}


// equation (3)
function leadlag(data1, data2) {
	let d1 = data1.reduce((map, obj) => (map[obj.x] = obj.y, map), {}),
		d2 = data2.reduce((map, obj) => (map[obj.x] = obj.y, map), {});

	let bestVal = -100000,
		bestYr = 0;

	for (let yr = -10; yr < 10; yr++) {
		let rel = corr(d1, d2, yr);

		if (rel > bestVal) {
			bestVal = rel;
			bestYr = yr;
		}
	}

	return bestYr;
}


function mean(data, accessor = key => data[key]) {
	let elements = 0,
		mean = 0;

	for (let key in data) {
		mean += accessor(key);
		elements += 1;
	}
	mean /= elements;

	return mean;
}