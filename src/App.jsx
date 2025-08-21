import { useState, useRef, useEffect} from 'react'

let points = [];

let delay = 50;
let pointCount = 5;
let pointSize = 8;

let ongoing = false;
let pause = false;
let skip = false;

let paths = [];

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
    
    paths.forEach((path)=>{

      context.strokeStyle = "rgb(89, 158, 255)";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(path[0][0], path[0][1]);
      context.lineTo(path[1][0], path[1][1]);
      context.stroke();
    })

    points.forEach((point)=>{

      context.fillStyle = "white"
      context.beginPath();
      context.arc(point[0],point[1], pointSize, 0, 2 * Math.PI);
      context.fill();

    })

  }
  
  async function convexHull(){

    function pathCost(point1, point2){

      return Math.hypot(Math.abs(point1[0] - point2[0]), Math.abs(point1[1] - point2[1]));
    }

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

    // exclude the origin in the points since it doesnt have an associated slope

    sorted = sorted.slice(0,origin).concat(sorted.slice(origin+1));

    sorted = mergeSort(sorted);

    console.log(sorted);

    // now loop through and use cross product to create convex hull

    let current = [points[origin]];

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

        if (result >= 0){

        while (result >= 0){

          refresh();

          excluded.push(current[current.length-1]);
          current.pop();
          paths.pop();

          x1 = current[current.length-1][0] - current[current.length-2][0];
          y1 = current[current.length-1][1] - current[current.length-2][1];
          x2 = sorted[index][0] - current[current.length-2][0];
          y2 = sorted[index][1] - current[current.length-2][1];

          result = (y2 * x1) - (y1 * x2);
          await delay(100);

        }

        current.push(sorted[index]);
        paths.push([current[current.length-2],sorted[index]]);
        continue;

        }
      }

      // tack onto convex hull

      paths.push([current[current.length-1], sorted[index]]);
      current.push(sorted[index]);

      console.log(current);

      refresh();
      await delay(100);
    }

    paths.push([current[current.length-1], current[0]]);

    console.log(paths);

    refresh();

    // connect remaining points to the convex hull

    console.log(excluded, paths);
    
    while (excluded.length > 0){

      let [bestCost, bestPointIndex, bestPathIndex] = [Infinity, null, null];

      for (let [pointIndex, point] of excluded.entries()){

        for (let [pathIndex, path] of paths.entries()){
          
          // compare distance from the points of the path to the new point then subtracts the length of the path
          // in the first place to check for less loss

          const cost = (pathCost(path[0], point) + pathCost(point, path[1])) - pathCost(path[0], path[1]);

          if (cost < bestCost){

            [bestCost, bestPointIndex, bestPathIndex] = [cost, pointIndex, pathIndex];

          }
          
        }

      }

      // get rid of the original path and add the 2 new paths

      const [point] = excluded.splice(bestPointIndex, 1); // in brackets to unpack it out of the array splice returns deleted elements in

      const path = paths[bestPathIndex].slice();

      paths.splice(bestPathIndex, 1);

      paths.push([path[0], point]);
      paths.push([point, path[1]]);

      refresh();
      await delay(100);

    }

    console.log(paths);
    // refresh();

    // return new Promise(()=>{




    // })

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

                    // <p id="code" style={{"opacity" : visibility}}><span style={{"fontWeight" : 500, 'fontSize' : 18}}>depth-first search implementation</span> <br/> copy and paste code</p>
                    // isnt updated when done like this for some reason

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
                  convexHull();

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

                let newGrid = grid;

                if (ongoing){

                  reset = true;
                  await delay(Math.max(delayTime*2, 50));
                }

                for (let row = 0; row < newGrid.length; row++){

                  for (let col = 0; col < newGrid.length; col++){

                    if ((row != start[0] || col != start[1]) && (row != end[0] || col != end[1])){

                      tiles[row * newGrid.length + col].current.textContent = "";
                    }

                    newGrid[row][col] = 0;
                  }
                }

                setState(newGrid.slice());
              }}>
                reset
              </button>

            </div>

          </div>

          <p id="delayHeading">delay</p>

          <div id="delaySliderContainer">

            <input className="slider" id="delaySlider" type="range" min="0" max="500" step="10" defaultValue="50" onInput={async ()=>{

              const slider = document.getElementById("delaySlider");
              delay = slider.value;

              const size = slider.offsetWidth;

              const value = document.getElementById("value");
              value.textContent = delay
              setDelayPos(25 + size * (delay / 550));

              console.log("size", size);

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

                  const x = Math.floor(Math.random() *  width);
                  const y = Math.floor(Math.random() *  height);

                  // const x = 100;
                  // const y = 10;

                  console.log(x, y);

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

                const value = document.getElementById("value");
                value.textContent = pointSize;
                setSizePos(25 + size * (delay / 550));

                console.log("size", pointSize);

              }}/>

              <p id="sizeValue" style={{"position" : "absolute", "height" : `${15}px`,"fontSize" : `${14}px`, "left" :  countPosition}}>50</p>

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
