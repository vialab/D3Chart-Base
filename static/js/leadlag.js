/// Lead/Lag calculation

// Equation (1) from the paper "Who Leads Whom Topical Lead-Lag Analysis across Corpora" is not implemented, because it's a topic aware proportion of documents in the corpus
// this is data we hoped to get rom the dimenions analytics API, since the data coming from the server is random normal distributions, we'll pretend those numbers are n-gram occurence percentages
// E.G: a value of "y=0.00006" where "x=2000" means that for this imaginary n-gram, it occurred 0.00006% of all n-grams for that year, in that corpus.
function shift(array, offset) {
  result = [];
  for (let i = offset; i < array.length; i++) {
    result.push(array[i]);
  }
  for (let i = 0; i < offset; i++) {
    result.push(array[i]);
  }
  return result;
}

// equation (3)
function leadlag(data1, data2) {
  let d1 = Object.values(data1);
  let d2 = Object.values(data2);
  let d1Mean = mean(d1);
  let d2Mean = mean(d2);
  let d1STD = standardDeviation(d1, d1Mean);
  let d2STD = standardDeviation(d2, d2Mean);
  let highestRelation = 0;
  let bestOffset = 0;

  for (let offset = 0; offset < d1.length; offset++) {
    let shiftedArray = shift(d1, offset);
    let sum = 0;
    for (let i = 0; i < shiftedArray.length; i++) {
      sum +=
        ((shiftedArray[i].y - d1Mean) / d1STD) * ((d2[i].y - d2Mean) / d2STD);
    }
    if (sum > highestRelation) {
      highestRelation = sum;
      bestOffset = offset;
      console.log(`Offset: ${bestOffset}`);
    }
    console.log(`Sum: ${sum}`);
  }

  return bestOffset;
}

function mean(array) {
  result = 0;
  for (let i = 0; i < array.length; i++) {
    result += array[i].y;
  }

  return result / array.length;
}

function standardDeviation(array, mean) {
  sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += (array[i].y - mean) ** 2;
  }
  return Math.sqrt(sum);
}
