async function twoOpt(){

  if (path.length == 0){

    // generate random path if there isnt a path to improve

    randomize();

  }

  let improvement = true;

  let bestCost = pathCost();

  await delay(delayTime);
  
  while (improvement){

    improvement = false;

    for (let point1 = 1; point1 < path.length-1; point1++){
      // reason for the 1 and the -1 for the 2nd point is due to the fact it always has to go back to the origin
      // and if you start reversing a section with the origin in it suddenly 2 edges are going to the origin
      // and the entire graph explodes, in other words it has to start with the origin and end with the origin
      
      for (let point2 = point1+1; point2 < path.length-1; point2++){

        let original = path.slice();

        let section = path.slice(point1, point2+1); // gets the entire section between these 2 points to attempt to "untwist" it
        section.reverse();

        path.splice(point1, point2+1 - point1, ...section);

        const cost = pathCost();

        if (cost < bestCost){

          console.log(original, path.slice(), cost, bestCost);

          improvement = true;
          bestCost = cost;

          refresh();
          await delay(delayTime);
        }

        else{

          section.reverse();
          path.splice(point1, point2+1 - point1, ...section);

        }

      }

      await delay(delayTime);

    }

  }

}