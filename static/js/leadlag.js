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
 * @param  {Array} data1 - [{y:}] requires y value
 * @param  {Array} data2 - [{y:}] requires y value
 * @returns {Number} the alignment shift for data1 where it best aligns with data2
 */
function leadlag(data1, data2) {
  let d1 = Object.values(data1);
  let d2 = Object.values(data2);
  //the length of the lines are not the same thefore, one line has a break in it.
  //if there is a break in the line they are not comparable in terms for frequency
  if (d1[0].x - d2[0].x || d1[d1.length - 1].x - d2[d2.length - 1].x) {
    return 0;
  }
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
      console.log(`sum: ${sum}`);
      console.log(`Offset: ${bestOffset}`);
    }
  }

  return bestOffset;
}
/**
 * @param  {Array} array - expects [{y:}]
 * @returns {Float} returns the mean of the set
 */
function mean(array) {
  result = 0;
  for (let i = 0; i < array.length; i++) {
    result += array[i].y;
  }

  return result / array.length;
}
/**
 * @param  {Array} array - expects [{y:}]
 * @param  {Float} mean - the mean of the array set
 * @return {Float} the standard deviation of the set
 */
function standardDeviation(array, mean) {
  sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum += (array[i].y - mean) ** 2;
  }
  return Math.sqrt(sum);
}
