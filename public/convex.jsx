async function convexHull(){

  function mergeSort(array){

    if (array.length == 1){

      return array;
    }

    const middle = array.length/2;

    let left = mergeSort(array.slice(0, middle));
    let right = mergeSort(array.slice(middle));

    console.log(left, right);

    let newArray = [];

    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length){

      if (left[leftIndex][2] > right[rightIndex][2]){

        newArray.push(left[leftIndex]);
        leftIndex++;
      }
      else{

        newArray.push(right[rightIndex]);
        rightIndex++;
      }
    }

    if (leftIndex < left.length){

      newArray = newArray.concat(left.slice(leftIndex));
    }
    else if (rightIndex < right.length){

      newArray = newArray.concat(right.slice(rightIndex));
    }

    return newArray;

  }

  let sorted = points.slice();

  let minX = 9999;
  let currentY = 9999;

  // begin with finding the bottom-left most point; it just has to be in a point already on the convex hull

  let origin = null;

  for (let index = 0; index < points.length; index++){

    if (points[index][0] < minX || points[index][0] == minX && points[index][1] > currentY){

      minX = points[index][0];
      currentY = points[index][1];

      origin = index;

    }    
  }

  // sort the points by their slope according to the bottom-left; prevents points from stretching across the convex hull

  console.log(points.length);

  for (let index = 0; index < points.length; index++){

    if (index == origin){

      // this will definitely cause a error from division by zero: same coordinates

      continue;
    }

    // division by zero can be an issue here, it can be fixed by checking whether points are on top of another
    // but it rare enough that it isnt much of a bother (other than when its origin - origin)

    const slope = (points[index][1] - points[origin][1]) / (points[index][0] - points[origin][0]);

    sorted[index].push(slope);
  }

  // exclude the origin in the points since it doesnt have an associated slope, also its the starting point

  sorted = sorted.slice(0,origin).concat(sorted.slice(origin+1));

  sorted = mergeSort(sorted);

  console.log(sorted);

  // now loop through and use cross product to create convex hull

  let current = [points[origin]];
  path.push(points[origin]);

  let excluded = [];

  for (let index = 0; index < sorted.length; index++){

    console.log(current.slice());

    if (current.length > 1){

      // cross product to compare

      let x1 = current[current.length-1][0] - current[current.length-2][0];
      let y1 = current[current.length-1][1] - current[current.length-2][1];
      let x2 = sorted[index][0] - current[current.length-2][0];
      let y2 = sorted[index][1] - current[current.length-2][1];

      let result = (y2 * x1) - (y1 * x2);

      while (result >= 0){

        refresh();

        excluded.push(current[current.length-1]);
        current.pop();
        path.pop();

        x1 = current[current.length-1][0] - current[current.length-2][0];
        y1 = current[current.length-1][1] - current[current.length-2][1];
        x2 = sorted[index][0] - current[current.length-2][0];
        y2 = sorted[index][1] - current[current.length-2][1];

        result = (y2 * x1) - (y1 * x2);
        await delay(delayTime);

      }
    }

    // tack onto convex hull

    path.push(sorted[index]);
    current.push(sorted[index]);

    console.log(current.slice());

    refresh();
    await delay(delayTime);
  }

  path.push(current[0]); // connect to origin

  console.log(path.slice());

  refresh();

  // connect remaining points to the convex hull

  console.log(excluded, path);
  
  while (excluded.length > 0){

    let [bestCost, bestPointIndex, insertIndex] = [Infinity, null, null];

    for (let [pointIndex, point] of excluded.entries()){

      for (let index = 0; index < path.length-1; index++){

        const cost = (pathCost(path[index], point) + pathCost(point, path[index+1])) - pathCost(path[index], path[index+1]);          

        // compare distance from the points of the path to the new point then subtracts the length of the path
        // in the first place to check for less loss

        if (cost < bestCost){

          [bestCost, bestPointIndex, insertIndex] = [cost, pointIndex, index];

        }

      }

    }

    // insert between the 2 points and remove the point as an option

    const [point] = excluded.splice(bestPointIndex, 1); // in brackets to unpack it out of the array that splice returns deleted elements in

    path.splice(insertIndex+1, 0, point);

    refresh();
    await delay(delayTime);

  }

}