import { useState, useRef, useEffect} from 'react'

let points = [];

let delayTime = 100;
let pointCount = 5;
let pointSize = 8;

let ongoing = false;
let pause = false;
let skip = false;

let path = [];

function App() {

  const [delayPosition, setDelayPos] = useState(40);
  const [countPosition, setCountPos] = useState(40);
  const [sizePosition, setSizePos] = useState(40);

  useEffect(()=>{

    // canvas has issues with setting sizing in css and % values so this is being done instead

    const canvas = document.getElementById("graphic");
    const panelSize = document.getElementById("description").offsetWidth + 16;

    canvas.width = window.innerWidth - panelSize * 2;
    canvas.height = window.innerHeight;

  }, []); // by using an empty array as the dependency this only runs when it is altered, or after the first render

  function delay(time){

    return new Promise((done)=>{setTimeout(done, time)});
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

      if (points[index][1] == points[origin][1] && points[index][0] == points[origin][0]){

        // ignore if its the origin, thisll definitely cause divison by 0

        continue;
      }

      console.log(points[index][1], points[origin][1], points[index][0], points[origin][0]);

      // in the situation division by 0 occurs, im not sure what to do but either prevent duplicate coordinates or
      // shift the point over marginally so that it doesnt occur, id prefer the latter for simplicity

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

      console.log(current);

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

      console.log(current);

      refresh();
      await delay(delayTime);
    }

    // paths.push([current[current.length-1], current[0]]);
    path.push(current[0]); // connect to origin

    // console.log(paths);
    console.log(path.slice());

    refresh();

    // connect remaining points to the convex hull

    // console.log(excluded, paths);
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

      const [point] = excluded.splice(bestPointIndex, 1); // in brackets to unpack it out of the array splice returns deleted elements in

      path.splice(insertIndex+1, 0, point);

      refresh();
      await delay(delayTime);

    }

    console.log(path);
    // refresh();

    // return new Promise(()=>{




    // })

  }

  async function twoOpt(){

    if (path.length == 0){

      // generate graph using nearest neighbor if there isnt a path to improve

    }

    let improvement = true;

    let bestCost = pathCost(null, null);
    
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

          const cost = pathCost(null, null);

          if (cost < bestCost){

            console.log(original, path.slice(), cost, bestCost);

            improvement = true;
            bestCost = cost;

            refresh();
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

    // console.log(givenPoints.slice());

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

      if (currentPath.length >= 3 && getLeftMost(pointsLeft[point], currentPath[lastPoint-1], currentPath[lastPoint-2]) != getLeftMost(currentPath[lastPoint], currentPath[lastPoint-1], currentPath[lastPoint-2]) && 
          getLeftMost(currentPath[lastPoint-1], pointsLeft[point], currentPath[lastPoint] != getLeftMost(currentPath[lastPoint-2], pointsLeft[point], currentPath[lastPoint]))){

          // its hard to see without a graphic, this basically checks against a line from one point to another, if the first parameter
          // is to the left relative to the 2nd parameter the origin then it returns true, otherwise false. if 2 points
          // from the same line segment are on the other side of that line and if the same is true from the other line segment as the
          // origin then there has to be a crossing or intersection
          
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

    // steps:
    // randomize solution
    // improve based on temperature and cost

    

  }

  return (
    <>

      <div className="panel"> 

        <div id="heading">

            <h1 id="title">TSVIS</h1>
            <a id="github" href="https://github.com/tinysuperion/mazevis" target="_blank">
              <img id="github-logo" src="github-mark.png"></img>
            </a>
        </div>

        <p id="description">visualize _ </p>

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

              </select>

              <button className="infoButton" onClick={async ()=>{

                const selection = document.getElementById("algorithmSelection").value;

                if (selection == "convex"){
                 
                  setText(

                    <p><span style={{"fontWeight" : 500, 'fontSize' : 18}}>convex-hull</span> <br/> _ <br/> <span style={{"fontWeight" : 500, 'fontSize' : 17}}>result</span> <br/> depth-first search results in mazes with straight long halls and few branches </p>
                  )

                  const file = await fetch("dfs.jsx");
                  const fileContent = await file.text();

                  const formattedContent = changeIndent(fileContent, 2);

                  setCode(

                  <div>
                    <p style={{"fontSize": 14}}><span style={{"fontWeight" : 500, 'fontSize' : 18}}>depth-first search implementation<br/>
                      <a href="https://github.com/tinysuperion/mazevis/blob/main/public/dfs.jsx" target="_blank">implementation</a>
                      </span><br/><br/>

                      {formattedContent}

                    </p>
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
                  }
                  else{

                    run.textContent = "pause";
                  }

                  return;
                }

                ongoing = true;

                const selection = document.getElementById("algorithmSelection").value;

                // displayNum = false;

                // clear grid

                if (selection == "convex"){

                  // await convexHull;

                  path = [];
                  refresh();

                  convexHull();

                }

                else if (selection == "2opt"){

                  twoOpt();
                }

                else if (selection == "nearest"){

                  path = [];
                  refresh();

                  nearestNeighbor();
                }

                else if (selection == "branch"){

                  bestCost = Infinity;
                  bestPath = [];

                  path = [];
                  refresh();

                  branch(0, [points[0]], points.slice(1));

                }

                ongoing = false;
                skip = false;

                run.textContent = "start";
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

              <button className="control" id="draw" onClick={async ()=>{

              }}>
                draw
              </button>

              <button className="control" id="randomize" onClick={async ()=>{

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

              <input className="slider" id="countSlider" type="range" min="0" max="500" step="10" defaultValue="50" onInput={async ()=>{

                const slider = document.getElementById("countSlider");
                pointCount = slider.value;

                const size = slider.offsetWidth;

                const value = document.getElementById("countValue");
                value.textContent = pointCount;
                setCountPos(25 + size * (pointCount / 550));

                console.log("count", pointCount);

              }}/>

              <p id="countValue" style={{"position" : "absolute", "height" : `${15}px`,"fontSize" : `${14}px`, "left" :  countPosition}}>50</p>

              <p style={{"marginTop" : "20px"}}> point size</p>

              <input className="slider" id="sizeSlider" type="range" min="0" max="500" step="10" defaultValue="50" onInput={async ()=>{

                const slider = document.getElementById("sizeSlider");
                pointSize = slider.value;

                const size = slider.offsetWidth;

                const value = document.getElementById("sizeValue");
                value.textContent = pointSize;
                setSizePos(25 + size * (pointSize / 550));

                console.log("size", pointSize);

              }}/>

              <p id="sizeValue" style={{"position" : "absolute", "height" : `${15}px`,"fontSize" : `${14}px`, "left" :  sizePosition}}>50</p>

            </div>

          </div>

        </div>

      </div>

      <canvas id="graphic" style={
        {
          "marginLeft" : "16px", 
          "marginRight" : "16px", 
          "position" : "absolute", 
          "left" : "20%", 
          "top" : "0px",
          "backgroundColor" : "rgb(30,30,33)"
        }} 
        >

      </canvas>

    </>
  )
}

export default App
