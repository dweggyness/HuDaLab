const width = 900;
const height = 500;

const treeVizWidth = 500;
const cartesianVizWidth = width - treeVizWidth;

const borderWidth = 1.5;
const rtreeHistory = [];

const darkgray = "#555555";
const gray = "#8c8c8c";
const lightgray = "#ececec";
const lightblue = "#e0e9fa";

let curStep = 5;
let playing = false;

let playTimer = null;

// base data for the RTree and RCartesian.
// the visualizations are generated based off this data, so if the data is changed
// the visualization changes too. its a state machine

// properties
// layer: int - whcih layer the node is on. 1 is top layer, 2 middle, 3 botom
// node: string - name of this node. used as an ID as well
// order: int - which order the node will be placed on their respective layers
// isGap: bool - if true, renders as an empty space ( used to provide spacing )
// fill: string - fill color of the node, if any. defaults to gray
const rtreeBaseArr = [
  { node: "R1", layer: 1, isGap: false, order: 1 },
  { node: "R2", layer: 1, isGap: false, order: 2 },

  { node: "B1", layer: 2, isGap: false, order: 1 },
  { node: "B2", layer: 2, isGap: false, order: 2 },
  { layer: 2, isGap: true, order: 3 },
  { node: "B3", layer: 2, isGap: false, order: 4 },
  { node: "B4", layer: 2, isGap: false, order: 5 },

  { node: "N1", layer: 3, isGap: false, order: 1 },
  { node: "N2", layer: 3, isGap: false, order: 2 },
  { layer: 3, isGap: true, order: 3 },
  { node: "N3", layer: 3, isGap: false, order: 4 },
  { node: "N4", layer: 3, isGap: false, order: 5 },
  { node: "N5", layer: 3, isGap: false, order: 6 },
  { layer: 3, isGap: true, order: 7 },
  { node: "N6", layer: 3, isGap: false, order: 8 },
  { node: "N7", layer: 3, isGap: false, order: 9 },
  { layer: 3, isGap: true, order: 10 },
  { node: "N8", layer: 3, isGap: false, order: 11 },
  { node: "N9", layer: 3, isGap: false, order: 12 },
]

// properties: 
// node: string - node: string - name of this node. used as an ID as well
// source: [Num, Num] - starting point of arrow, relative to the entire viz
// target: [Num, Num]- ending point of arrow, relative to the entire viz
// highlight: bool - if true, colors the arrow green. otherwise is black
const rtreeArrowsArr = [
  {source: [230, 80], target: [190, 150], node:"R1"},
  {source: [270, 80], target: [310, 150], node:"R2"},
  {source: [170, 170], target: [50, 240], node:"B1"},
  {source: [210, 170], target: [190, 240], node:"B2"},
  {source: [290, 170], target: [330, 240], node:"B3"},
  {source: [330, 170], target: [450, 240], node:"B4"},
]


/* given settings for a certain step, the function generates the tree/cartesian array that will be
 passed to the draw function. it uses the base array, and then modifies it using the settings
 parameter that is passed to it. 

by running this function for every step in the visualization, we can then think of each step
as just the 'diff' from the base array.


the function diffs by using the "node" property of each object in the array parameter. 
e.g settings = [{ node: "N5", layer: 3, order: 5 }].
the function will create a new array, and object with obj.node === "N5" will be overwriten
by the one passed to it in the settings parameter. 
e.g original node "N5" == { node: "N5", layer: 3, isGap: false, order: 6 }
then, after this function, it will be { node: "N5", layer: 3, isGap: false, order: 5 }
"order" has changed, "layer" stays the same, "isGap" stays the same

@params
settings - array of objects

where objects = { node: string, layer: int, isGap: bool, order: int, highlight: bool }

*/
const getTreeArr = (settings) => {
  let arr = [ ...rtreeBaseArr]; // clone

  for (const obj of settings) {
    if (obj.node === undefined) {
      arr.push(obj);
    } else if (arr.find(arrObj => arrObj.node == obj.node)) {
      // search the array for an object with obj.node == node, and overwrite it with the new one
      arr = arr.map(arrObj => arrObj.node == obj.node ? {...arrObj, ...obj} : arrObj);
    } else {
      arr.push(obj);
    }
  }

  return arr;
}

const getArrowArr = (settings) => {
  let arr = [ ...rtreeArrowsArr]; // clone

  for (const obj of settings) {
    if (obj.node === undefined) {
      arr.push(obj);
    } else {
      // search the array for an object with obj.node == node, and overwrite it with the new one
      arr = arr.map(arrObj => arrObj.node == obj.node ? {...arrObj, ...obj} : arrObj);
    }
  }

  return arr;
}


// steps array. each step contains objects that details it's difference from the
// "base" arrays located above.
const stepsArr = [
  // step 1
  { tree:[],   
    cartesian:[{ node: "Q", x: 16, y: 15, width: 2, height: 2 }], 
    arrow: [],
    stepText: `We want to insert a new polygon Q into the R-Tree.`,
    drawQPolygon: true,
  },
  // step 2
  { tree:[],   
    cartesian:[{ node: "Q", x: 16, y: 15, width: 2, height: 2, color: "orange", fill: "orange", highlight: true }], 
    arrow: [],
    stepText: `First, construct a bounding rectangle for Q.`,
    drawQPolygon: true,
  },
  // step 3
  { tree:[{ node: "R1", fill: "yellow" }], 
    cartesian:[
      { node: "R1", highlight: "true" }, 
      { node: "", x: 9, y: 4, width: 9, height: 15, color: "red", highlight: "true", fill: "lightcoral", isNotHoverable: true }, 
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "orange", fill: "orange" }
    ], 
    arrow: [],
    stepText: `Start from the root, check how much R1 will have to expand if we insert
      Q into R1. The shaded region is the amount R1 will have to expand.`
  },
  // step 4
  { tree:[{ node: "R2", fill: "yellow" }, ], 
    cartesian:[
      { node: "R2", highlight: "true" },  
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "orange", fill: "orange" }
    ], 
    arrow: [],
    stepText: `Check how much R2 will have to expand if we insert Q into R2. 
      As Q is inside R2, there is no need to expand. Thus it is efficient to insert Q into R2`
  },
  // step 5
  { tree:[{ node: "R2", fill: "palegreen" }, ], 
    cartesian:[
      { node: "R2", highlight: "true" },  
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "orange", fill: "orange" }
    ], 
    arrow: [],
    stepText: `As R2 does not expand, we pick R2 as our node. 
      However, as R2 is not a leaf node, we continue the process from R2.`
  },
  // step 6
  { tree:[{ node: "B3", fill: "yellow" }, { node: "R2", fill: "palegreen" }], 
    cartesian:[
      { node: "B3", highlight: "true" },   
      { node: " ", x: 13, y: 15, width: 5, height: 4, color: "teal", highlight: "true", fill: "lightskyblue", isNotHoverable: true }, 
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "orange", fill: "orange" }
    ], 
    arrow: [{ node: "R2", highlight: true }],
    stepText: `In R2, we check how much B3 will have to expand if we insert Q into B3. 
      The shaded area is the amount that B3 will have to expand. `
  },
  // step 7
  { tree:[{ node: "B4", fill: "yellow" }, { node: "R2", fill: "palegreen" }], 
    cartesian:[
      { node: "B4", highlight: "true" },  
      { node: "", x: 15, y: 15, width: 4, height: 2, color: "teal", highlight: "true", fill: "lightskyblue", isNotHoverable: true }, 
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "orange", fill: "orange" }
    ], 
    arrow: [{ node: "R2", highlight: true }],
    stepText: `We also check how much B4 will have to expand if we insert Q into B4. 
      The shaded area is the amount that B4 will have to expand. `
  },
  // step 8
  { tree:[{ node: "B4", fill: "palegreen" }, { node: "R2", fill: "palegreen" }], 
    cartesian:[
      { node: "B4", highlight: "true" },   
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "orange", fill: "orange" }
    ], 
    arrow: [{ node: "B4", highlight: true }, { node: "R2", highlight: true }],
    stepText: `As inserting Q into B4 expands the node by a smaller area, it is thus more 
    efficient to insert Q into B4. We pick B4 as our node.`
  },
  // step 9
  { tree:[{node: "Q", order: 13, layer: 3, fill: "palegreen"}, { node: "B4", fill: "palegreen" }, { node: "R2", fill: "palegreen" }], 
    cartesian:[
      { node: "B4", highlight: "true" },   
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "green", fill: "palegreen" }
    ], 
    arrow: [{ node: "B4", highlight: true }, { node: "R2", highlight: true }],
    stepText: `As B4 is a leaf node, and adding an element into B4 won’t cause it to overflow 
      ( M = 3 ),we insert Q into B4.`,
    drawQTree: true,
    drawQPolygon: true,
  },
  // step 10
  { tree:[{node: "Q", order: 13, layer: 3, fill: "palegreen"}, { node: "B4", fill: "yellow" }, { node: "R2", fill: "palegreen" }], 
    cartesian:[
      { node: "B4", color: "none" },   
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "green", fill: "palegreen" }
    ], 
    arrow: [{ node: "B4", highlight: true }, { node: "R2", highlight: true }],
    stepText: `After inserting Q into B4, we recalculate the bounding rectangle of B4.`,
    drawQTree: true,
    drawQPolygon: true,
  },
  // step 11
  { tree:[{node: "Q", order: 13, layer: 3, fill: "palegreen"}, { node: "B4", fill: "palegreen" }, { node: "R2", fill: "palegreen" }], 
    cartesian:[
      { node: "B4", height: 9, highlight: true },   
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "green", fill: "palegreen" }
    ], 
    arrow: [{ node: "B4", highlight: true }, { node: "R2", highlight: true }],
    stepText: `The bounding rectangle of B4 is recalculated.`,
    drawQTree: true,
    drawQPolygon: true,
  },
  // step 12
  { tree:[{node: "Q", order: 13, layer: 3, fill: "palegreen"}, { node: "B4", fill: "palegreen" }, { node: "R2", fill: "yellow" }], 
    cartesian:[
      { node: "B4", height: 9 },
      { node: "R2", highlight: true},   
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "green", fill: "palegreen" }
    ], 
    arrow: [{ node: "B4", highlight: true }, { node: "R2", highlight: true }],
    stepText: `We also recalculate the bounding rectangle of R2, but as Q is completely within
    the bounds of R2, the area of the bounding rectangle does not change.`,
    drawQTree: true,
    drawQPolygon: true,
  },
  // step 13
  { tree:[{node: "Q", order: 13, layer: 3, fill: "palegreen"}, { node: "B4", fill: "palegreen" }, { node: "R2", fill: "palegreen" }], 
    cartesian:[
      { node: "B4", height: 9 },   
      { node: "Q", x: 16, y: 15, width: 2, height: 2, color: "green", fill: "palegreen" }
    ], 
    arrow: [{ node: "B4", highlight: true }, { node: "R2", highlight: true }],
    stepText: `As the bounding rectangle adjustment has propagated to the root, insertion is
    complete.`,
    drawQTree: true,
    drawQPolygon: true,
  },
]




//////////////////////////////////////





// when a node is hovered, highlight the node by scaling it and changing its colour
const onNodeHover = (node) => {
  const treeNode = d3.selectAll("#treeVizContainer > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node.node;
    }
    return false;
  });
  const cartesianNode = d3.selectAll("#cartesianVizContainer > g > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node.node;
    }
    return false;
  })

  treeNode.select("rect")
    .transition()
    .attr("fill", "skyblue")
    .attr("transform", "scale(1.1)")
  treeNode.raise();

  cartesianNode.select("rect")
    .transition()
    .attr("fill", "skyblue")
    .attr("transform", (d) => {
      if (d.width == 0.1 && d.height == 0.1) { // is point, scale more so its visible
        return "scale(2)";
      }
      return "scale(1.05)"
    });
  
  // hide the text of all other nodes in the cartesian plane, only show text of currently hovered node
  d3.selectAll("#cartesianVizContainer > g > g > text")
    .filter((d) => d.node !== node.node)
    .attr("style", "display: none;");
}

// on node unhover, we reset the style of that node to its original state
const onNodeUnhover = (node) => {
  const treeNode = d3.selectAll("#treeVizContainer > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node.node;
    }
    return false;
  });
  const cartesianNode = d3.selectAll("#cartesianVizContainer > g > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node.node;
    }
    return false;
  })

  // reset scale/colour of the node, now that it is unhovered
  treeNode.select("rect")
    .transition()
    .attr("fill", (d) => d.fill ? d.fill : lightgray )
    .attr("transform", "scale(1)");

  cartesianNode.select("rect")
    .transition()
    .attr("fill", (d) => d.fill ? d.fill : "none" )
    .attr("transform", "scale(1)");

  // display the text of all other nodes again
  d3.selectAll("#cartesianVizContainer > g > g > text")
    .filter((d) => d.node !== node)
    .attr("style", "display: block; pointer-events: none;");
}

var id = 0;
// draw the tree view of the RTree, which is to the left
function drawTreeViz(rtree) {
  const treeViz = d3.select("#treeVizContainer");
  treeViz.transition()
    .attr("transform", "translate(0, 100)");
  
  const treeData = rtree.data;

  var treeWidth = width / 2;
  var treeHeight = height * 0.4;

  var nodeHeight = 17;
  var nodeWidth = 34;

  const treemap = d3.tree().size([treeWidth, treeHeight]);
  let nodes = d3.hierarchy(treeData);
  treemap.separation((a, b) => a.parent == b.parent ? 1 : 2)
  treemap(nodes)

  console.log('node', nodes);

  // treemap.separation((a, b) => (a.parent == b.parent ? 1 : 2) / 3);
  const node = treeViz.selectAll(".node")
    .data(nodes.descendants(), (d, i) => d.id || (d.id = ++i));

  const nodeEnter = node.enter()
    .append("g")
    .attr("transform", d => "translate(" + d.x + "," + d.y  + ")")

  nodeEnter.append("rect")
    .attr("x", (d) => - nodeWidth / 2)
    .attr("y", (d) => - nodeHeight / 2)
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("class", (d) => "treeNode")
    .attr("fill", (d) => lightgray)
    .attr("stroke", darkgray);
  
  nodeEnter.append("text")
    .attr("dy", "5")
    .attr("x", d => - nodeHeight / 2)
    .text(d => d.data.node);
  // const link = treeViz.selectAll(".link")
  //   .data(nodes.descendants().slice(1))
  //   .enter().append("path")
  //   .attr("class", "link")
  //   .style("stroke", d => d.data.level)
  //   .attr("d", d => {
  //     return "M" + d.y + "," + d.x
  //       + "C" + (d.y + d.parent.y) / 2 + "," + d.x
  //       + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
  //       + " " + d.parent.y + "," + d.parent.x;
  //   });

    
  treeViz.selectAll("path")
  .data(nodes.links())
  .enter().append("path")
  .attr("fill", "none")
  .attr("stroke", "black")
  .attr("d", d3.linkHorizontal()
    .source(function(d) { return [d.source.x, d.source.y + nodeHeight / 2]})
    .target(function(d) { return [d.target.x, d.target.y - nodeHeight / 2]})
  );


  node.exit().remove();
  treeViz.exit().remove();
  // reset the canvas
  // treeViz.html("");
  // // construct the tree
  // let nodes = treeViz
  //   .selectAll("g")
  //   .data(rtree)
  //   .enter()
  //   .append("g")

  // // draw boxes for each node
  // nodes
  //   .append("rect")
  //   .attr("x", (d) => { 
  //     let layerXConst = layer1X;
  //     if (d.layer == 1) {
  //       layerXConst = layer1X;
  //     } else if (d.layer == 2) {
  //       layerXConst = layer2X;
  //     } else if (d.layer == 3) {
  //       layerXConst = layer3X;
  //     }
  //     return layerXConst + (d.order - 1) * nodeWidth;
  //   })
  //   .attr("y", (d) => 60 + (d.layer - 1) * 90)
  //   .attr("width", nodeWidth)
  //   .attr("height", nodeHeight)
  //   .attr("class", (d) => {
  //     if (!d.isGap) return "treeNode";
  //     return "";
  //   })
  //   .attr("fill", (d) => {
  //     if (d.fill) return d.fill;
  //     if (d.isGap) return "none";
  //     return lightgray;
  //   })
  //   .attr("style", (d) => {
  //     if (d.isGap) return "";
  //     return `outline: 2px solid ${gray};`
  //   })
  //   .on('mouseover', (d, i) => {
  //     if (!i.isGap) {
  //       currentHoveredNode = i.node;
  //       onNodeHover(i);
  //     }
  //   })
  //   .on('mouseout', (d, i) => {
  //     if (!i.isGap) {
  //       currentHoveredNode = null;
  //       onNodeUnhover(i);
  //     }
  //   });
  
  // // draw text for each node
  // nodes
  //   .append("text")
  //   .text((d) => { 
  //     if (d.node) return d.node;
  //     return "";
  //   })
  //   .attr("x", (d) => { 
  //     let layerXConst = layer1X;
  //     if (d.layer == 1) {
  //       layerXConst = layer1X;
  //     } else if (d.layer == 2) {
  //       layerXConst = layer2X;
  //     } else if (d.layer == 3) {
  //       layerXConst = layer3X;
  //     }
  //     return layerXConst + (d.order - 1) * nodeWidth + 10;
  //   })
  //   .attr("y", (d) => 60 + (d.layer - 1) * 90 + 15)
  //   .attr("style", "pointer-events: none;");

  // const arrowContainer = treeViz.append("g")
  //   .attr("id", "treeVizArrowContainer");

  // for (let i = 0; i < links.length; i++) {
  //   let link = d3.linkVertical()
  //   .source(d => d.source)
  //   .target(d => d.target);

  //   arrowContainer
  //   .selectAll("path")
  //   .data(links)
  //   .join("path")
  //   .attr("d", link)
  //   .attr("fill", "none")
  //   .attr("stroke", (d) => d.highlight ? "darkgreen" : darkgray);

  //   arrowContainer.exit().remove();
  // }
}

// draw the cartesian/graph view of the r-tree. to the right
function drawCartesianViz(rtreeObj) {
  const rtree = rtreeObj.all();

  for (let i = 0; i < rtree.length; i++) {
    let curNode = rtree[i];
    curNode.width = curNode.maxX - curNode.minX;
    curNode.height = curNode.maxY - curNode.minY;
  }

  const cartesianViz = d3.select("#cartesianVizContainer");
  cartesianViz.html("");

  const margin = 30;
  const graphHeight = 300;
  const graphWidth = width - treeVizWidth - (margin * 2);
  
  const leftAxis = cartesianViz
    .append("rect")
    .attr("transform", `translate(${margin}, ${margin})`)
    .attr("width", borderWidth)
    .attr("height", graphHeight);

  const bottomAxis = cartesianViz
    .append("rect")
    .attr("transform", `translate(${margin}, ${margin + graphHeight})`)
    .attr("width", graphWidth)
    .attr("height", borderWidth);

  const cartesianObjectsContainer = cartesianViz
    .append("g");

  const scaleX = graphWidth / 20;
  const scaleY = graphHeight / 20;

  // construct the tree
  let nodes = cartesianObjectsContainer
    .selectAll("g")
    .data(rtree)
    .enter()
    .append("g")

  nodes
    .append("rect")
    .attr("x", (d) => margin + d.minX * scaleX)
    .attr("y", (d) => margin + d.minY * scaleY)
    .attr("width", (d) => d.width * scaleX)
    .attr("height",(d) => d.height * scaleY)
    .attr("fill", (d) => d.fill ? d.fill : "none")
    .attr("fill-opacity", 0.7)
    .attr("style", (d) => d.highlight ? `outline: 5px solid ${d.color};` : `outline: 1px solid black;`)
    .attr("class", "cartesianNode")
    .on('mouseover', (d, i) => {
      if (!i.isGap && !i.isNotHoverable) {
        currentHoveredNode = i.node;
        onNodeHover(i);
      }
    })
    .on('mouseout', (d, i) => {
      if (!i.isGap && !i.isNotHoverable) {
        currentHoveredNode = null;
        onNodeUnhover(i);
      }
    });
      
  nodes
    .append("text")
    .text((d) => { 
      if (d.node) return d.node;
      return "";
    })
    .attr("x", (d) => {
      if (d.textPlacement == "bottom") {
        return margin + d.minX * scaleX + d.width * scaleX - 20;
      }
      return margin + d.minX * scaleX + 5;
    })
    .attr("y", (d) => {
      if (d.textPlacement == "bottom") {
        return margin + d.minY * scaleY + d.height * scaleY - 5;
      }
      return margin + d.minY * scaleY + 20;
    })
    .attr("style", "pointer-events: none;");

  let exitingNodes = nodes.exit()
  exitingNodes.remove();
}

// // event listeners for click events for the buttons at the top
function setupPlaybackController() {
//   d3.select(".playButton")
//     .on("click", () => handlePlayButton());

  d3.select("#nextStepButton")
    .on("click", () => {
      incrementStep();
      stopPlayback();
    })

//   d3.select("#prevStepButton")
//     .on("click", () => {
//       decrementStep();
//       stopPlayback();
//     })

//   d3.select("#resetStepButton")
//     .on("click", () => {
//       curStep = 1;
//       changeStep(curStep);
//       stopPlayback();
//     })

//   d3.select("#lastStepButton")
//     .on("click", () => {
//       curStep = stepsArr.length;
//       changeStep(curStep);
//       stopPlayback();
//     })
}

// // toggle play state 
// const handlePlayButton = () => {
//   playing = !playing;
  
//   if (playing) {
//     startPlayback();
//   } else {
//     stopPlayback();
//   }
// }

// const isPlaybackFinished = () => {
//   return curStep == stepsArr.length;
// }

// const stopPlayback = () => {
//   d3.select(".playIcon").attr("style", "display: block");
//   d3.select(".pauseIcon").attr("style", "display: none");

//   clearInterval(playTimer);
//   playTimer = null;
//   playing = false;
// }

// const startPlayback = () => {
//   if (isPlaybackFinished()) return;
//   d3.select(".playIcon").attr("style", "display: none");
//   d3.select(".pauseIcon").attr("style", "display: block");

//   playTimer = setInterval(() => {
//     if (curStep == stepsArr.length) {
//       stopPlayback();
//     }
//     incrementStep()
//   }, 2000);
//   playing = true;
// }


// function decrementStep() {
//   if (curStep > 1) {
//     curStep -= 1;
//     changeStep(curStep);
//   }
// }

function incrementStep() {
  if (curStep < stepsArr.length) {
    curStep += 1;
    changeStep(curStep);
  }
}

// draws the visualization based on the data passed to it.
function draw(treeArr, cartesianArr) {
  drawTreeViz(treeArr);
  drawCartesianViz(cartesianArr);
}

// updates the visualization to a certain step. 
function changeStep(step) {
  let curStep = step - 1; // step 1 is index 0 in the arr

  // update the tree/cartesian arrays using the info
  // update the visualization 
  draw(rtreeHistory[curStep],rtreeHistory[curStep]);
}

// draw the elements that won't have to change with the data, e.g the viz border
function main() {
  const rCartesianBaseArr = [
    { node: "N1", minX: 1, minY: 16, maxX: 3, maxY: 19},
    { node: "N2", minX: 5, minY: 14, maxX: 5.1, maxY: 14.1}, // point
    { node: "N3", minX: 4, minY: 4, maxX: 6, maxY: 8},
    { node: "N4", minX: 7, minY: 6, maxX: 7.1, maxY: 6.1},
    { node: "N5", minX: 5, minY: 9, maxX: 9, maxY: 11},
  
    { node: "N6", minX: 6, minY: 15, maxX: 10, maxY: 17},
    { node: "N7", minX: 11, minY: 16, maxX: 13, maxY: 19},
  
    { node: "N8", minX: 19, minY: 15, maxX: 19.1, maxY: 15.1},
    { node: "N9", minX: 15, minY: 8, maxX: 19, maxY: 11},
  ]

  let rbushe = new rbush(3);
  for (const obj of rCartesianBaseArr) {
    rbushe.insert(obj);

    // creates a copy of the rtree, at this state, and store it in a history
    let tempRTree = new rbush(3);
    tempRTree.data = structuredClone(rbushe.data);
    tempRTree._maxEntries = rbushe._maxEntries;
    tempRTree._minEntries = rbushe._minEntries;
    rtreeHistory.push(tempRTree);
  }

  console.log(rbushe.data);


  // container for the entire component
  let mainContainer = d3.select("#rtree-container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  // container for viz part of component, incl tree viz and cartesian viz
  let vizContainer = mainContainer
    .append("g")
    .attr("transform", `translate(${borderWidth}, ${borderWidth})`)
    .attr("id", "vizContainer")

  // border for the viz component
  vizContainer
    .append("rect")
    .attr("class", "vizContainer")
    .attr("width", width - borderWidth * 2)
    .attr("height", height - borderWidth * 2)
    .attr("fill", "none");

  // setup tree visualization container
  vizContainer.append("g")
    .attr("id", "treeVizContainer");

  // setup cartesian visualization container
  vizContainer.append("g")
  .attr("transform", `translate(${treeVizWidth}, 0)`)
  .attr("id", "cartesianVizContainer");

  setupPlaybackController();

  changeStep(curStep); 
}

main();
