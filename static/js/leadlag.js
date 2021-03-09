/// Lead/Lag calculation
/**
 * @param  {Array} array
 * @param  {Number} offset - shifts the alignment of the array. For example if we shift this array [1,2,3] by 1 it becomes [3,1,2]
 * @returns {Array} - a new array that is shifted based on the offset
 */
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
/**
 *
 * @param {Array.<number>} data1
 * @param {Array.<number>} data2 - data2.length  must = data1.length * 3
 */
function leadlag(data1, data2) {
  if (data1.length * 3 != data2.length) {
    return 0;
  }
  let d1 = data1;
  let d2 = data2;
  let d1Mean = mean(d1);
  let d2Mean = mean(d2);
  let d1STD = standardDeviation(d1, d1Mean);
  let d2STD = standardDeviation(d2, d2Mean);
  let leadLagValues = [];
  let highestRelation = 0;
  let bestOffset = 0;
  //diff 10
  //d2 15
  //d1 5
  //123456789a

  //i->0-10
  //j->0-5
  for (let i = 0; i < d2.length - d1.length + 1; ++i) {
    let currentLeadLag = 0;
    for (let j = 0; j < d1.length; ++j) {
      currentLeadLag +=
        ((d1[j] - d1Mean) / d1STD) * ((d2[i + j] - d2Mean) / d2STD);
    }
    leadLagValues.push(currentLeadLag);
    if (highestRelation < currentLeadLag) {
      highestRelation = currentLeadLag;
      bestOffset = i - d1.length;
    }
  }
  return { values: leadLagValues, bestOffset: bestOffset };
}
/**
 *
 * @param {Array.<number>} data1
 * @param {Array.<number>} data2 - data2.length  must = data1.length * 3
 */
//function leadlag(data1, data2) {
//  if (data1.length * 3 != data2.length) {
//    return 0;
//  }
//  let d1 = data1;
//  let d2 = data2;
//  let d1Mean = mean(d1);
//  let d2Mean = mean(d2);
//  let d1STD = standardDeviation(d1, d1Mean);
//  let d2STD = standardDeviation(d2, d2Mean);
//  let leadLagValues = [];
//  let highestRelation = 0;
//  let bestOffset = 0;
//  //diff 10
//  //d2 15
//  //d1 5
//  //123456789a
//
//  //i->0-10
//  //j->0-5
//  for (let i = 0; i < d2.length - d1.length + 1; ++i) {
//    let currentLeadLag = 0;
//    for (let j = 0; j < d1.length; ++j) {
//      currentLeadLag += Math.abs(
//        (d1[j] - d1Mean) / d1STD - (d2[i + j] - d2Mean) / d2STD
//      );
//    }
//    if (i == 0) {
//      highestRelation = currentLeadLag;
//    }
//    leadLagValues.push(currentLeadLag);
//    if (highestRelation > currentLeadLag) {
//      highestRelation = currentLeadLag;
//      bestOffset = i - d1.length;
//    }
//  }
//  return { values: leadLagValues, bestOffset: bestOffset };
//}
///**
// * @param  {Array} data1 - [{y:}] requires y value
// * @param  {Array} data2 - [{y:}] requires y value
// * @returns {Number} the alignment shift for data1 where it best aligns with data2
// */
//function leadlag(data1, data2) {
//  let d1 = Object.values(data1);
//  let d2 = Object.values(data2);
//  //the length of the lines are not the same thefore, one line has a break in it.
//  //if there is a break in the line they are not comparable in terms for frequency
//  if (d1[0].x - d2[0].x || d1[d1.length - 1].x - d2[d2.length - 1].x) {
//    return 0;
//  }
//  let d1Mean = mean(d1);
//  let d2Mean = mean(d2);
//  let d1STD = standardDeviation(d1, d1Mean);
//  let d2STD = standardDeviation(d2, d2Mean);
//  let highestRelation = 0;
//  let bestOffset = 0;
//
//  for (let offset = 0; offset < d1.length; ++offset) {
//    let shiftedArray = shift(d1, offset);
//    let sum = 0;
//    for (let i = 0; i < shiftedArray.length; ++i) {
//      sum +=
//        ((shiftedArray[i].y - d1Mean) / d1STD) * ((d2[i].y - d2Mean) / d2STD);
//    }
//    if (sum > highestRelation) {
//      highestRelation = sum;
//      bestOffset = offset;
//    }
//  }
//  if (d1.length - 1 + -bestOffset > bestOffset) {
//    return -bestOffset;
//  }
//
//  return d1.length - 1 + -bestOffset;
//}
/**
 * @param  {Array} array - expects [{y:}]
 * @returns {Float} returns the mean of the set
 */
function mean(array) {
  let result = 0;
  for (let i = 0; i < array.length; ++i) {
    result += array[i];
  }

  return result / array.length;
}
/**
 * @param  {Array} array - expects [{y:}]
 * @param  {Float} mean - the mean of the array set
 * @return {Float} the standard deviation of the set
 */
function standardDeviation(array, mean) {
  let sum = 0;
  for (let i = 0; i < array.length; ++i) {
    sum += (array[i] - mean) ** 2;
  }
  return Math.sqrt(sum);
}
