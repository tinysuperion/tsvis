async function nearestNeighbor(){

  let origin = points[0];
  let pointsLeft = points.slice(1);

  path.push(origin);

  while (pointsLeft.length > 0){

    let distance = 99999;
    let closest;

    for (let index = 0; index < pointsLeft.length; index++){

      let difference = pathCost(origin, pointsLeft[index]);

      if (difference < distance){

        distance = difference;
        closest = index;

      }

    }

    path.push(pointsLeft[closest]);
    origin = pointsLeft[closest];
    pointsLeft.splice(closest, 1);
    refresh();

    await delay(delayTime);

  }

  path.push(path[0]);
  refresh();

  await delay(delayTime);

}