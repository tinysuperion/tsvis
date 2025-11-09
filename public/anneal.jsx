async function anneal(){

  // i havent tried out different "temperature coeffiecients", i copied the rates
  // from https://tspvis.com/ which are lenient and im sure will give the annealing some time

  const coolRate =
    path.length < 10
      ? 1 - 1e-3
      : path.length < 15
      ? 1 - 1e-5
      : path.length < 25
      ? 1 - 1e-6
      : 1 - 5e-7;

  if (path.length-1 < points.length){
    // -1 as the path includes a repeat of the start as the last point to return to it

    path = [];
    
    randomize(); // created a randomized solution
  }

  let currentCost = pathCost();

  let bestPath = path.slice();
  let bestCost = currentCost;

  if (points.length == 3){
    // no points can be swapped without not returning to the start

    return;
  }

  for (let temperature = 100; temperature > 1e-6; temperature *= coolRate){

    // swap 2 random points, this will be the neighbor, then just check to select it
    // as the current route based on temperature

    let index1 = 0
    let index2 = 0

    while (index1 == index2){

      // offest by 1 to not alter the start and end, points naturally has a point less than path
      // since path has an extra point to go back to the start so only an offest of 1 is needed

      index1 = Math.floor(Math.random() * (points.length-1)) + 1;
      index2 = Math.floor(Math.random() * (points.length-1)) + 1;
    }

    const initialCost = pathCost();

    [path[index1], path[index2]] = [path[index2], path[index1]];

    const newCost = pathCost();

    if (newCost < initialCost || Math.random() < Math.exp((initialCost - newCost) / temperature)){

      // if e to the power of distance the path increased by that is divided by temperature is greater than math.random
      // the path is still chosen

      if (newCost < bestCost){

        [bestCost, bestPath] = [newCost, path.slice()];
      }

    }

    else{

      [path[index1], path[index2]] = [path[index2], path[index1]]; // path not accepted, swap back
    }

    refresh();
    await delay(delayTime);
  }

  path = bestPath;
  refresh();
}