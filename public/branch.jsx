let bestCost = Infinity;
let bestPath = [];

async function branch(cost, currentPath, givenPoints){

  // you can include cost and bestpath through return statements and the such but i wont make that change

  function getLeftMost(point1, origin, point2){

    // this uses the cross product, its weird its called that since i think of the cross product as
    // getting a vector that is 90 degrees from 2 vectors but whatever, it basically gets the leftmost
    // point relative to some origin compared to some other point

    let [x1, y1, x2, y2] = [point1[0] - origin[0], point1[1] - origin[1], point2[0] - origin[0], point2[1] - origin[1]];
    // subtract origin from the points coordinates to make it relative to the origin

    return y1 * x2 > y2 * x1;
    // greater = leftmost, its basically comparing the relative slopes
  }

  if (givenPoints.length == 0){

    cost += pathCost(currentPath[currentPath.length-1], currentPath[0]);
    currentPath.push(currentPath[0]);

    if (cost < bestCost){

      bestCost = cost;
      bestPath = currentPath;

      path = bestPath;

      refresh();
    }

    return;

  }

  let pointsLeft = givenPoints.slice();

  for (let point = 0; point < givenPoints.length; point++){

    let newCost = cost;

    const lastPoint = currentPath.length-1;
    // if (currentPath.length != 0){

      newCost += pathCost(currentPath[lastPoint], givenPoints[point]);
    // }

    if (newCost >= bestCost){
      
      continue;
    }

    // check intersections here

    if (currentPath.length >= 3 && 
        getLeftMost(pointsLeft[point], currentPath[lastPoint-1], currentPath[lastPoint-2]) 
        != getLeftMost(currentPath[lastPoint], currentPath[lastPoint-1], currentPath[lastPoint-2]) && 
        getLeftMost(currentPath[lastPoint-1], pointsLeft[point], currentPath[lastPoint]
        != getLeftMost(currentPath[lastPoint-2], pointsLeft[point], currentPath[lastPoint]))){

        // its hard to see without a graphic, this basically checks against a line from one point to another, if the first parameter
        // is to the left relative to the 2nd parameter the origin then it returns true, otherwise false. if 2 points
        // from the same line segment are on the other side of that line and if the same is true from the other line segment as the
        // origin then there has to be a crossing or intersection, and so you skip the point
        
        continue;

    }

    pointsLeft.splice(point, 1);
    currentPath.push(givenPoints[point]);

    branch(newCost, currentPath.slice(), pointsLeft.slice());

    pointsLeft.splice(point, 0, givenPoints[point]);      
    currentPath.pop();

  }

}