import { useState, useRef, useEffect} from 'react'

let points = [];
let iterations = [];
let iteration = null;

let delayTime = 100;
let pointCount = 5;
let pointSize = 8;

let ongoing = false;
let pause = false;
let skip = false;
let draw = false;

let path = [];


function App() {

  const [distance, setDistance] = useState(0);

  // sliders
  const [delayPosition, setDelayPos] = useState(40);
  const [countPosition, setCountPos] = useState(40);
  const [sizePosition, setSizePos] = useState(50);
  const [distanceHistory, setDistanceHistory] = useState([]);


  // algorithm information (separated since trying to fetch in a component using the algorithm name doesnt work as async functions arent allowed in client components like fetch(file).then(), in other words async client components arent allowed)
  const [algorithm, setAlgorithm] = useState();
  const [description, setDescription] = useState();
  const [descriptionVisibility, setDescriptionVisibility] = useState("hidden");

  // distance history
  const [distanceVisibility, setDistanceVisibility] = useState("hidden");

  useEffect(()=>{

    // canvas has issues with setting sizing in css and % values so this is being done instead

    const canvas = document.getElementById("graphic");
    const panel =  document.getElementById("description");

    canvas.width = window.innerWidth - panel.scrollWidth - 16;
    canvas.height = window.innerHeight;

    function iterate(event){

      // go back or forth an iteration in an algorithm

      if (!pause && !(path.length != 0 && ongoing == false)){

        return;
      }

      iteration = (iteration != null) ? iteration : iterations.length-1;

      if (event.key == "ArrowLeft" && iteration > 0){

        iteration--;
        path = iterations[iteration];
        refresh();

      }

      else if (event.key == "ArrowRight" && iteration < (iterations.length-1)){

        iteration++;
        path = iterations[iteration];
        refresh();

      }
    }


    document.addEventListener("keydown", iterate);

    function drawPoint(event){

      const graphic = document.getElementById("graphic");

      const rect = graphic.getBoundingClientRect();

      if (draw && event.pageX > rect.left){

        points.push([event.pageX - rect.left, event.offsetY]);
        refresh();
      }

    }

    document.addEventListener("mousedown", drawPoint);
    

    return ()=>{

      document.removeEventListener("keydown", iterate);
      document.removeEventListener("mousedown", (event)=>{


      });
    }

  }, []); // by using an empty array as the dependency this only runs when it is altered, or after the first render

  function delay(time){

    iterations.push(path.slice()); // pushes new iteration for progressing through using left and right arrows  

    if (skip){

      return;
    }

    return new Promise(async (done)=>{

      // iterations.push(path.slice()); // pushes new iteration for progressing through using left and right arrows

      while (pause){

        await new Promise((resolve)=>{setTimeout(resolve, 100);});

      }
      
      setTimeout(done, time)});
  }

  function refresh(){

    const canvas = document.getElementById("graphic");
    const context = canvas.getContext("2d");

    // clear canvas
    context.clearRect(0,0, canvas.width, canvas.height);
    
    // paths.forEach((path)=>{

    //   context.strokeStyle = "rgb(89, 158, 255)";
    //   context.lineWidth = 5;
    //   context.beginPath();
    //   context.moveTo(path[0][0], path[0][1]);
    //   context.lineTo(path[1][0], path[1][1]);
    //   context.stroke();
    // })

    for (let index = 0; index < path.length-1; index++){

      context.strokeStyle = "rgb(89, 158, 255)";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(path[index][0], path[index][1]);
      context.lineTo(path[index+1][0], path[index+1][1]);
      context.stroke(); 

    }

    points.forEach((point)=>{

      context.fillStyle = "white"
      context.beginPath();
      context.arc(point[0],point[1], pointSize, 0, 2 * Math.PI);
      context.fill();

    })

  }
  
  function pathCost(point1, point2){

    if (point1 == undefined && point2 == undefined){

      let cost = 0;

      for (let index = 0; index < path.length-1; index++){

        cost += Math.hypot(Math.abs(path[index][0] - path[index+1][0]), Math.abs(path[index][1] - path[index+1][1]));
      }

      return cost;
    }

    return Math.hypot(Math.abs(point1[0] - point2[0]), Math.abs(point1[1] - point2[1]));
  }



  async function convexHull(){

    function mergeSort(array){

      // console.log("testing!");

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

      // console.log(points[index][1], points[origin][1], points[index][0], points[origin][0]);

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

      // console.log(current.slice());

      if (current.length > 1){

        // cross product to compare

        let x1 = current[current.length-1][0] - current[current.length-2][0];
        let y1 = current[current.length-1][1] - current[current.length-2][1];
        let x2 = sorted[index][0] - current[current.length-2][0];
        let y2 = sorted[index][1] - current[current.length-2][1];

        let result = (y2 * x1) - (y1 * x2);

        // if (result >= 0){

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

      // paths.push([current[current.length-1], sorted[index]]);
      path.push(sorted[index]);
      current.push(sorted[index]);

      // console.log(current.slice());

      refresh();
      await delay(delayTime);
    }

    // paths.push([current[current.length-1], current[0]]);
    path.push(current[0]); // connect to origin

    // console.log(paths);
    // console.log(path.slice());

    refresh();

    // connect remaining points to the convex hull

    // console.log(excluded, paths);
    // console.log(excluded, path);
    
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

    // console.log(path);

  }

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

  let bestCost = Infinity;
  let bestPath = [];

  async function branch(cost, currentPath, givenPoints){

    // console.log("\n new call", givenPoints.slice());

    // its better to include cost and bestpath through return statements and the such
    // im not sure if ill ever do that change though, certainly not now

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

        // bestCost = newCost;
        bestCost = cost;
        bestPath = currentPath;

        path = bestPath;

        refresh();
      }

      // console.log("finish with ", currentPath.slice());

      return;

    }

    let pointsLeft = givenPoints.slice();

    for (let point = 0; point < givenPoints.length; point++){

      let newCost = cost;

      const lastPoint = currentPath.length-1;

      newCost += pathCost(currentPath[lastPoint], givenPoints[point]);


      if (newCost >= bestCost){
        
        continue;
      }

      // check intersections here

      if (currentPath.length >= 3 && getLeftMost(pointsLeft[point], currentPath[lastPoint-1], currentPath[lastPoint-2]) != getLeftMost(currentPath[lastPoint], currentPath[lastPoint-1], currentPath[lastPoint-2]) && 
          getLeftMost(currentPath[lastPoint-1], pointsLeft[point], currentPath[lastPoint] != getLeftMost(currentPath[lastPoint-2], pointsLeft[point], currentPath[lastPoint]))){

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

    // let temperature = 100;

    if (path.length-1 < points.length){

      path = [];
     
      randomize();
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

      // temperature *= coolRate;

      refresh();
      await delay(delayTime);
    }

    path = bestPath;
    refresh();

    // console.log(bestPath);
  }

  async function randomize(){

    let remainingPoints = points.slice();

    while (remainingPoints.length != 0){

      let index = Math.floor(Math.random() * remainingPoints.length);

      path.push(remainingPoints[index]);
      remainingPoints.splice(index, 1);
    }

    path.push(path[0]);

    refresh()

  }

  return (
    <>

      <div id="panel"> 

        <div id="heading">

            <h1 id="title">TSVIS</h1>
            <a id="github" href="https://github.com/tinysuperion/tsvis" target="_blank">
              <img id="github-logo" src="github-mark.png"></img>
            </a>
        </div>

        <p id="description">visualize travelling salesman algorithms. <br/>the left and right arrow keys can be used when a solution has been created to look through each iteration</p>

        <hr/>

        <div className="interface">

          <div className="algorithm">

            <p>algorithm</p> 

            <div className="selection">

              <select id="algorithmSelection">

                <option className="option" value="convex">convex hull</option>
                <option className="option" value="2opt">2-opt</option>
                <option className="option" value="nearest">nearest neighbor</option>
                <option className="option" value="branch">branch and bound</option>
                <option className="option" value="anneal" >simulated annealing</option>

              </select>

              <button className="infoButton" onClick={async ()=>{

                const selection = document.getElementById("algorithmSelection").value;

                setDescriptionVisibility("visible");

                if (selection == "convex"){

                  setAlgorithm("convex-hull");

                  const file = await fetch("convex.jsx");
                  const fileContent = await file.text();

                  console.log(fileContent);

                  // const formattedContent = changeIndent(fileContent, 2);
                  
                  // console.log(formattedContent);

                  setDescription(

                  <div>
                    <div style={{"fontSize": 14}}>

                      <h2>description</h2>
                      <p>convex hull works through creating a convex hull of the points and connecting the remaining points to the existing hull until no points are remaining<br/>
                        a solid approximation of a solution is made by basically creating an outline of the points which avoids crossings<br/><br/>
                        
                        the steps are as follows: <br/></p>

                      <ul>

                        <li>first create the convex hull 
                          
                          <ul>

                            <li>to do this the bottom-left most point is found as this has to be on the convex hull because there are no points past it</li>
                            <li>then, using that bottom-left most point as an origin the slopes of all of the remaining points are calculated. this is because by going in a clock-wise or counter-clockwise fashion it avoids crossings</li>
                            <li>finally, the sorted points are iterated through and using the cross product,  something similar to a relative slope is produced where the exact equation used is (y2 * x1) - (y1 * x2) and where all the coordinates (of 2 points, (x1,y1) and (x2,y2)) are offset by the coordinates of the origin or the bottom-left most point. this dictates the left-most point, which youll want for a convex hull as to include all points with the smallest amount of points </li>

                          </ul>
                          
                        </li>

                        <br/>

                        <li>luckily, thats most of the work done! the only thing left to do is connect the remaining points to the hull by iterating through all of the points and then going through all of the line segments in the hull to see which has the lowest cost. after going through all of the points the point and segment that produced the lowest cost is added to the path and removed from the pool and the process continues until there are no remaining points</li>

                      </ul>

                      
                      <hr/>

                      <h2>implementation</h2>
                      
                        <span style={{"fontWeight" : 500, 'fontSize' : 18}}>
                          <a href="https://github.com/tinysuperion/tsvis/blob/main/public/convex.jsx" target="_blank">see it on github</a>
                        </span><br/><br/>

                      {fileContent}

                    </div>
                  </div>
                  )
                }

                else if (selection == "2opt"){

                  setAlgorithm("2-opt");

                  const file = await fetch("2-opt.jsx");
                  const fileContent = await file.text();

                  console.log(fileContent);

                  setDescription(

                  <div>
                    <div style={{"fontSize": 14}}>

                      <h2>description</h2>
                      <p>2-opt improves a solution by getting rid of crossings (lines cross over each other which make the path longer) through reversing sections of the path<br/><br/>
                        
                        the steps are as follows: <br/></p>

                      <ul>

                        <li>for each point, go through all points (excluding the first and last points of the path which are the same point since its a closed path)</li>
                        <li>then get the section from the path starting from that point to the other point and reverse it</li>
                        <li>replace the section with the reversed one and check the cost of the path</li>
                        <li>if its cheaper, keep it, but otherwise undo and keep going until no improvements are made</li>
                        
                      </ul>

                      
                      <hr/>

                      <h2>implementation</h2>

                      <span style={{"fontWeight" : 500, 'fontSize' : 18}}>
                        <a href="https://github.com/tinysuperion/tsvis/blob/main/public/convex.jsx" target="_blank">see it on github</a>
                      </span><br/><br/>

                      {fileContent}

                    </div>
                  </div>
                  )

                }

                else if (selection ==  "nearest"){

                  setAlgorithm("nearest-neighbor");

                  const file = await fetch("nearest.jsx");
                  const fileContent = await file.text();

                  console.log(fileContent);

                  setDescription(

                  <div>
                    <div style={{"fontSize": 14}}>

                      <h2>description</h2>
                      <p>nearest-neighbor selects the nearest point from some point at every step<br/><br/>
                        
                        no steps needed!<br/></p>

                      <hr/>

                      <h2>implementation</h2>

                      <span style={{"fontWeight" : 500, 'fontSize' : 18}}>
                        <a href="https://github.com/tinysuperion/tsvis/blob/main/public/nearest.jsx" target="_blank">see it on github</a>
                      </span><br/><br/>

                      {fileContent}

                    </div>
                  </div>
                  )

                }
                
                else if (selection == "branch"){

                  setAlgorithm("branch and bound");

                  const file = await fetch("branch.jsx");
                  const fileContent = await file.text();

                  console.log(fileContent);

                  setDescription(

                  <div>
                    <div style={{"fontSize": 14}}>

                      <h2>description</h2>
                      <p>branch and bound is a recursive algorithm that exhausts every possible combination of points but cuts off paths which are greater than the shortest path found or have crossings (lines cross over each other)<br/><br/>
                        
                        the steps are as follows:<br/></p>

                      <ul>

                        <li>loop through all points</li>
                        <li>for each point call the function with that point removed from the available pool and add it to a path</li>
                        <li>if the current path is longer than a found solution or a crossing is found then stop the branch
                          
                          <ul>

                            <li>the cross product (afaik) is (y2*x1) - (y1*x2) where the greater number is leftmost and the 2 points (x1,y1) and (x2,y2) 
                              are offset by some origin which is a third point, so it would offset the x values of those points with the x value of the origin 
                              and so on, if this doesnt make sense thats alright. to make sense myself i visualized a simple example where the origin is (0,0) with 2 arbitrary positive points. this basically just made it appear to me as though it compared the slopes of the points from the origin as height is mulitplied by the distance of the other point which would reduce its slope the farther it is from the origin, and any alteration of this origin would result in a similar result</li>

                            <li>now finally, to check for a crossing the cross product is used before adding a point to the path</li>
                            <li>it works through finding whether the current point is more leftmost than the 3rd last with the 2nd last as an origin and then doing the same but instead comparing the last point instead of the current point and checks whether the current point and last point are leftmost</li>
                            <li>then it finds the leftmost point where the origin is the point and the 2 points are the 2nd to last and last point and then the same except the 2nd to last is replaced with the 3rd last point and checks if both the 2nd and 3rd last points are leftmost </li>
                            <li>if both the current and last points were leftmost to the 3rd and AND the 2nd and 3rd to last were leftmost to the last point there has to be a crossing. if this all went over your head i would absolutely agree with you so a diagram will be depicted below of how this results in a crossing</li>
                          </ul>

                        </li>

                        <li>continue until all possible branches are exhausted</li>
                        
                      </ul>


                      <h3 style={{"textAlign" : "center"}}>model of finding a crossing using the cross product</h3>

                      <img src="finding a crossing.png" style={{"margin" : "0 auto", "display" : "block"}}></img>

                      <hr/>

                      <h2>implementation</h2>

                      <span style={{"fontWeight" : 500, 'fontSize' : 18}}>
                        <a href="https://github.com/tinysuperion/tsvis/blob/main/public/branch.jsx" target="_blank">see it on github</a>
                      </span><br/><br/>

                      {fileContent}

                    </div>
                  </div>
                  )

                }

                else if (selection == "anneal"){

                  setAlgorithm("simulated annealing");

                  const file = await fetch("anneal.jsx");
                  const fileContent = await file.text();

                  console.log(fileContent);

                  setDescription(

                  <div>
                    <div style={{"fontSize": 14}}>

                      <h2>description</h2>
                      <p>simulated annealing is an improvement algorithm that randomly swaps 2 points and checks if it creates a better solution with the added feature of possibly selecting a worse solution based on temperature<br/><br/>
                        
                        the steps are as follows:<br/></p>

                      <ul>

                        <li>select 2 random points and swap them</li>
                        <li>if its a better solution set the path to it and save it as the best solution</li>
                        <li>otherwise check if a random number from 0-1 is less than e to the power of the difference / temperature. if it is select it to be the current path</li>
                        <li>apply the cool rate to the temperature and continue until the temperature reachs a certain point</li>
                        
                      </ul>

                      <hr/>

                      <h2>implementation</h2>

                      <span style={{"fontWeight" : 500, 'fontSize' : 18}}>
                        <a href="https://github.com/tinysuperion/tsvis/blob/main/public/branch.jsx" target="_blank">see it on github</a>
                      </span><br/><br/>

                      {fileContent}

                    </div>
                  </div>
                  )
                  
                }

              }}>?</button>

            </div>

            <p>controls</p>

            <div className="controls">

              <button className="control" id="run" onClick={async ()=>{

                if (points.length == 0){

                  return;
                }

                const run = document.getElementById("run");
                run.textContent = "pause";

                if (ongoing){

                  pause = !pause;

                  if (pause){

                    run.textContent = "start";

                    // getting rid of duplicate iterations

                    let set = [];

                    for (let index = 0; index < iterations.length-1; index++){

                      if (JSON.stringify(iterations[index]) != JSON.stringify(iterations[index+1])){

                        set.push(iterations[index]);
                      }

                    }

                    if (set[set.length-1] == iterations[iterations.length-2]){

                      set.push(iterations[iterations.length-1]);
                    }

                    if (set.length == 0){

                      set.push(iterations[0]);
                    }

                    iterations = set;

                  }
                  else{

                    run.textContent = "pause";
                  }

                  return;
                }

                ongoing = true;

                iterations = [];
                iteration = null;

                const selection = document.getElementById("algorithmSelection").value;

                // displayNum = false;

                // clear grid

                if (selection == "convex"){

                  // await convexHull;

                  path = [];
                  refresh();

                  await convexHull();

                }

                else if (selection == "2opt"){

                  await twoOpt();
                }

                else if (selection == "nearest"){

                  path = [];
                  refresh();

                  await nearestNeighbor();
                }

                else if (selection == "branch"){

                  bestCost = Infinity;
                  bestPath = [];

                  path = [];
                  refresh();

                  await branch(0, [points[0]], points.slice(1));

                }

                else if (selection == "anneal"){

                  await anneal();

                }

                ongoing = false;
                pause = false;
                skip = false;
                run.textContent = "start";

                // get rid of duplicate iterations

                let set = [iterations[0]];

                for (let index = 1; index < iterations.length; index++){

                  if (JSON.stringify(iterations[index]) != JSON.stringify(iterations[index-1])){
                    // if the current index is unique then add it

                    set.push(iterations[index]);
                  }

                }

                iterations = set;

                const cost = Math.round(pathCost())

                setDistance(cost);
                setDistanceHistory([...distanceHistory, `${selection} : ${cost}`]);

              }}>
                start
              </button>

              <button className="control" onClick={()=>{

                skip = true;
              }}>
                skip
              </button>

              <button className="control" onClick={async ()=>{

                path = [];
                refresh();

              }}>
                reset
              </button>

            </div>

          </div>

          <div id="distanceContainer">

              {/* this is such a mess, just use absolute position instead, im not sure why the button isnt keeping its ratio*/}

              <p style={{"display" : "inline", "flex" : "1"}}>distance: {distance}</p>
                
              <button id="historyButton" onClick={()=>{

                if (distanceVisibility == "hidden"){

                  setDistanceVisibility("visible");
                }

                else{

                  setDistanceVisibility("hidden")
                }


              }}>?</button>

          </div>

          <p id="delayHeading">delay</p>

          <div id="delaySliderContainer">

            <input className="slider" id="delaySlider" type="range" min="0" max="500" step="10" defaultValue="50" onInput={async ()=>{

              const slider = document.getElementById("delaySlider");
              delayTime = slider.value;

              const size = slider.offsetWidth;

              const value = document.getElementById("value");
              value.textContent = delayTime
              setDelayPos(25 + size * (delayTime / 550));

            }}/>

            <p id="value" style={{"position" : "absolute", "height" : `${15}px`,"fontSize" : `${14}px`, "left" :  delayPosition}}>50</p>

          </div>

          <p>points</p>

          <div id="pointSettings">

            <div id="pointControls">

              <button className="control" id="draw" onClick={()=>{

                draw = !draw;

                const drawButton = document.getElementById("draw");
                
                if (draw){

                  drawButton.textContent = "stop";
                }
                else{

                  drawButton.textContent = "draw";
                }

              }}>
                draw
              </button>

              <button className="control" id="randomize" onClick={async ()=>{

                points = [];

                const canvas = document.getElementById("graphic");
                // const context = canvas.getContext("2d")

                const width = canvas.offsetWidth;
                const height = canvas.offsetHeight;
                for (let index = 0; index < pointCount; index++){

                  const x = Math.min(Math.max(pointSize * 2.5, Math.floor(Math.random() *  width)),  width - pointSize * 2.5);
                  const y = Math.min(Math.max(pointSize * 2.5, Math.floor(Math.random() *  height)),  height - pointSize * 2.5);

                  // const x = 100;
                  // const y = 10;

                  // console.log(x, y);

                  // context.fillStyle = "white"
                  // context.beginPath();
                  // context.arc(x,y, pointSize, 0, 2 * Math.PI);
                  // context.fill();

                  points.push([x,y]);

                  refresh();
                }


              }}>
                random
              </button>

            </div>

            <div id="pointSliderContainer">

              <p>point count</p>

              <input className="slider" id="countSlider" type="range" min="1" max="100" step="1" defaultValue="5" onInput={async ()=>{

                const slider = document.getElementById("countSlider");
                pointCount = slider.value;

                const size = slider.offsetWidth;

                const value = document.getElementById("countValue");
                value.textContent = pointCount;
                setCountPos(15 + size * (pointCount / 110));

                // console.log("count", pointCount);

              }}/>

              <p id="countValue" style={{"position" : "absolute", "height" : `${15}px`,"fontSize" : `${14}px`, "left" :  countPosition}}>5</p>

              <p style={{"marginTop" : "20px"}}> point size</p>

              <input className="slider" id="sizeSlider" type="range" min="1" max="30" step="1" defaultValue="8" onInput={async ()=>{

                const slider = document.getElementById("sizeSlider");
                pointSize = slider.value;

                const size = slider.clientWidth;

                const value = document.getElementById("sizeValue");
                value.textContent = pointSize;
                setSizePos(15 + size * (pointSize / 33));
                refresh();

              }}/>

              <p id="sizeValue" style={{"position" : "absolute", "height" : `${15}px`,"fontSize" : `${14}px`, "left" :  sizePosition}}>8</p>

            </div>

          </div>

        </div>

      </div>


      <div id="distanceHistory" style={{"visibility" : distanceVisibility}}>

        {/* serves as a popup for distance history, do some time, or dont thats ok */}

        <div style={{"display" : "flex", "alignItems" : "center","minWidth" : "200px"}}>

          <p style={{"display" : "inline", "flex" : "1 1 0%"}}>distance history</p>
          <button style={{"aspectRatio" : "1/1", "width" : "15%", "padding" : "2px"}} onClick={()=>{

            setDistanceHistory([]);

          }}>x</button>

        </div>
        
        <hr style={{"margin" : "5px"}}/>

          <ul>

            {/* <li>im a part of history!</li> */}

            {console.log(distanceHistory)}

            {distanceHistory.map((entry, index)=>{

              return <li key={index}>{entry}</li>
            })}

          </ul>

      </div>

      <div id="algorithmDescription" style={{"visibility" : descriptionVisibility}}>

        <button id="exitDescription" onClick={()=>{

          setDescriptionVisibility("hidden");

        }}>x</button>

        <h1 style={{"color" : "white"}}>{algorithm}</h1>

        <pre>

          <code>

              {description}

          </code>

        </pre>


      </div>

      <canvas id="graphic"></canvas>

    </>
  )
}

export default App
