const width = 900;
const height = 500;

const stepsWidth = 300;
const vizWidth = 600;
const treeVizHeight = 220;
const middleGapHeight = 30; // gap between the two visualizations
const cartesianVizHeight = height - treeVizHeight;
const stepsDisplayWidth = width - vizWidth;
const margin = 15;

const borderWidth = 1.5;
const rtreeHistory = [];

const darkgray = "#555555";
const gray = "#8c8c8c";
const lightgray = "#ececec";
const lightblue = "#e0e9fa";

let curStep = 1;
let playing = false;

let playTimer = null;


//////////////////////////////////////



// when a node is hovered, highlight the node by scaling it and changing its colour
const onNodeHover = (node) => {
  const treeNode = d3.selectAll("#treeVizContainer > g").filter((d) => {
    return d.id == node.id;
  });
  const cartesianNode = d3.selectAll("#cartesianVizContainer > g").filter((d) => {
    return d.id == node.id;
  })

  treeNode.select("rect")
    .transition()
    .attr("fill", "skyblue")
  treeNode.raise();

  cartesianNode.select("rect")
    .transition()
    .attr("fill", "skyblue");
}

// on node unhover, we reset the style of that node to its original state
const onNodeUnhover = (node) => {
  const treeNode = d3.selectAll("#treeVizContainer > g").filter((d) => {
    return d.id == node.id;
  });
  const cartesianNode = d3.selectAll("#cartesianVizContainer > g").filter((d) => {
    return d.id == node.id;
  })

  // reset colour of the node, now that it is unhovered
  treeNode.select("rect")
    .transition()
    .attr("fill", (d) => d.data.fill || lightgray )

  cartesianNode.select("rect")
    .transition()
    .attr("fill", "none");
}

var id = 0;
// draw the tree view of the RTree, which is to the left

var treeWidth = vizWidth;
var treeHeight = treeVizHeight - middleGapHeight - margin;
const tree = d3.tree().size([treeWidth, treeHeight]);
tree.separation((a, b) => a.parent == b.parent ? 1 : 2)
var root;

function createRoot(data) {
  let root = d3.hierarchy(data);
  root.x0 = treeWidth / 2;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = getKey(d.data);
  })

  return root;
}

// returns a 'unique' key for a RBush data object
// *known to be unique for our specific input, may not work for all cases ( dups etc )
function getKey(obj) {
  const { node, maxX, maxY, minX, minY } = obj;
  if (node) {
    return node + "-" + maxX + "-" + maxY + "-" + minX + "-" + minY;
  }
  return maxX + "-" + maxY + "-" + minX + "-" + minY;
}


// returns a deep cloned object of the tree
function cloneTree(rtree) {
  let tempRTree = new rbush(RTREE_MAX_ENTRIES);
  tempRTree.data = structuredClone(rtree.data);
  tempRTree._maxEntries = rtree._maxEntries;
  tempRTree._minEntries = rtree._minEntries;
  return tempRTree;
}

const nodeHeight = 17;
const nodeWidth = 34;

function drawTreeViz(source) {
  const treeViz = d3.select("#treeVizContainer");
  treeViz.transition()
    .attr("transform", `translate(${width - vizWidth}, ${margin * 2})`);

  let nodes = root.descendants();
  let links = root.links();

  tree(root);

  const node = treeViz.selectAll(".treeNode")
    .data(nodes, function(d) { return d.id; });

  const nodeEnter = node.enter()
    .append("g")
    .attr("class", "treeNode")

  nodeEnter.append("rect")
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("class", "treeRect")
    .attr("fill", (d) => d.data.fill || lightgray)
    .attr("stroke", darkgray)
    .on('mouseover', (d, i) => {
      onNodeHover(i);
    })
    .on('mouseout', (d, i) => {
      onNodeUnhover(i);
    })
    .attr("style", "fill-opacity: 0.5")
    .transition()
    .attr("transform", d => {
      return `translate(${d.x - nodeWidth / 2}, ${d.y - nodeHeight / 2})`
    })


  nodeEnter.append("text")
    .attr("dy", "5")
    .attr("x", d => - nodeHeight / 2)
    .text(d => {
      return d.data.node;
    })
    .attr("class", ".treeText")
    .attr("transform", d => {
      return `translate(${d.x}, ${d.y})`
    })
    .attr("style", "pointer-events: none;");

  // update
  var nodeUpdate = node
    .select("rect")
    .transition()
    .duration(500)
    .attr("transform", d => {
      return `translate(${d.x - nodeWidth / 2}, ${d.y - nodeHeight / 2})`
  });

  node
    .select("text")
    .transition()
    .duration(500)
    .attr("transform", d => {
      return `translate(${d.x}, ${d.y})`
  });

  node.select("rect")
    .attr("fill", (d) => {
      return d.data.fill || lightgray
    })

  const arrows = treeViz.selectAll("path").data(links);
  // arrows
  arrows.enter()
  .append("path")
  .attr("fill", "none")
  .attr("stroke", (d) => d.target.data.stroke || "black")
  .attr("d", d3.linkHorizontal()
    .source(function(d) { return [d.source.x, d.source.y + nodeHeight / 2]})
    .target(function(d) { return [d.target.x, d.target.y - nodeHeight / 2]})
  );

  // update
  arrows
  .transition()
  .attr("stroke", (d) => d.target.data.stroke || "black")
  .attr("d", d3.linkHorizontal()
    .source(function(d) { return [d.source.x, d.source.y + nodeHeight / 2]})
    .target(function(d) { return [d.target.x, d.target.y - nodeHeight / 2]})
  );

  arrows.exit().remove();


  // var nodeExit = node.exit()
  //   .transition()
  //   .duration(500)
  //   .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
  //   .remove();
  node.exit().remove();
  nodeEnter.exit().remove();
}


const graphWidth = vizWidth - (margin * 2);

// draw the graph axis etc that doesn't change between steps
function setupCartesianViz() {
  const cartesianViz = d3.select("#cartesianVizContainer");

  const leftAxis = cartesianViz
    .append("rect")
    .attr("transform", `translate(${margin}, ${margin * 2})`)
    .attr("width", borderWidth)
    .attr("height", cartesianVizHeight - margin * 3);

  const bottomAxis = cartesianViz
    .append("rect")
    .attr("transform", `translate(${margin}, ${cartesianVizHeight - margin})`)
    .attr("width", graphWidth)
    .attr("height", borderWidth);

}

const effectiveCartesianVizHeight = cartesianVizHeight - margin * 2;

// draw the cartesian/graph view of the r-tree. to the right
function drawCartesianViz(rtreeArr) {
  const rtree = rtreeArr;
  // run some preprocessing for every node
  for (let i = 0; i < rtree.length; i++) {
    let curNode = rtree[i];
    const { maxX, maxY, minX, minY } = curNode;

    // create a width/height so its easier to draw shapes
    curNode.width = maxX - minX;
    curNode.height = maxY - minY;
    // create a unique key * (* - known to be unique for our specific input)
    curNode.id = getKey(curNode)
  }

  const cartesianViz = d3.select("#cartesianVizContainer")
  cartesianViz.transition();

  const scaleX = graphWidth / 20;
  const scaleY = effectiveCartesianVizHeight / 20;

  // construct the objects
  const node = cartesianViz.selectAll(".cartesianNode")
    .data(rtree, function(d) { return d.id; })

  const nodeEnter = node.enter()
    .append("g")
    .attr("class", "cartesianNode")

  nodeEnter.append("text")
    .text((d) => { 
      if (d.notVisible) return "";
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
    
  nodeEnter.append("rect")
    .attr("x", (d) => margin + d.minX * scaleX)
    .attr("y", (d) => margin + d.minY * scaleY)
    .attr("width", (d) => d.width * scaleX)
    .attr("height",(d) => d.height * scaleY)
    .attr("fill", (d) => 'none')
    .attr("style", (d) => 
      d.notVisible 
        ? `outline: 0px`
        : `outline: 1px solid ${d.highlight ? 'red' : 'black'}; fill-opacity: 0.5`
    );

  nodeEnter.append("svg:image")
    .attr("x", (d) => margin + d.minX * scaleX)
    .attr("y", (d) => margin + d.minY * scaleY)
    .attr("class", "cartesianPolygon")
    .attr("width", (d) => d.width * scaleX)
    .attr("height",(d) => d.height * scaleY)
    .attr("xlink:href", (d) => d.polygon)
    .attr("preserveAspectRatio", "none")
    .attr("style", (d) => 
      d.drawPolygon ? `object-fit: fill; opacity: 0.3; display: block` : `display: none`
    );

  // update
  node.select('text')
  .text((d) => { 
      if (d.notVisible) return "";
      if (d.node) return d.node;
      return "";
    })

  node.select("rect")
    .attr("x", (d) => margin + d.minX * scaleX)
    .attr("y", (d) => margin + d.minY * scaleY)
    .attr("style", (d) => 
      d.notVisible 
        ? `outline: 0px`
        : `outline: 1px solid ${d.highlight ? 'red' : 'black'}; fill-opacity: 0.5`
    );

  node.select(".cartesianPolygon")
    .attr("style", (d) => 
      d.drawPolygon ? `preserveAspectRatio: none; object-fit: fill; opacity: 0.3; display: block` : `display: none`
  );

  node.exit().remove();
}


// @@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@
// steps viz

// colors all the nodes that are in a past state to be blue, and colors all nodes
// that are in a future state to be gray
function updateButtonStates(id, type) {
  let findID = id;
  let bboxID = id;
  let nodeID = id;

  if (type === 'find') {
    nodeID--;
  }
  if (type === 'bbox') {
    nodeID--;
    findID--;
  }

  // update FIND buttons
  // color all find nodes before this one ( incl this one ) blue
  for (let i = 0; i <= findID; i++ ) {
    rtreeSteps[i].subSteps.find = true;
  }
  // color all nodes after this gray
  for (let i = findID + 1; i < rtreeSteps.length; i++ ) {
    rtreeSteps[i].subSteps.find = false;
  }

  // update BBOX buttons
  for (let i = 0; i <= bboxID; i++ ) {
    rtreeSteps[i].subSteps.bbox = true;
  }
  // color all nodes after this gray
  for (let i = bboxID + 1; i < rtreeSteps.length; i++ ) {
    rtreeSteps[i].subSteps.bbox = false;
  }
  
  // update NODE buttons
  // color all nodes before this one ( incl this one ) blue
  for (let i = 0; i <= nodeID; i++ ) {
    rtreeSteps[i].color = "skyblue";
  }
  // color all nodes after this gray
  for (let i = nodeID + 1; i < rtreeSteps.length; i++ ) {
    rtreeSteps[i].color = lightgray;
  }


}

// draw a polygon for the current node to be inserted
function bboxStepClicked(id) {
  updateButtonStates(id, 'bbox');

  const curTree = cloneTree(rtreeHistory[id]);
  const curNode = rtreeInsertionOrder[id];
  
  console.log(curTree);
  
  // set up the cartesianViz to look like the state (id - 1)
  let cartesianArr = curTree.allIncludingNonLeaf();
  cartesianArr.push(curTree.data); // include the root

  // append just the new node to be inserted
  // but hide the rect, and draw the polygon instead
  cartesianArr.push({...curNode, highlight: true, drawPolygon: true});

  drawViz(curTree, cartesianArr);
}

function findStepClicked(id) {
  updateButtonStates(id, 'find');

  const curNode = rtreeInsertionOrder[id];
  const curTree = cloneTree(rtreeHistory[id]);


  const subtreePath = curTree.getBestSubtree(curNode);

  // update the data of all nodes that is in the path of the _chooseSubtree function
  // to be colored
  let curPath = curTree.data;
  for (let i = 0; i < subtreePath.length; i++) {
    const curSubpath = subtreePath[i];
    if (i == 0) { // first subtree path is always the root
      curPath.fill = "#99cc66";
      curPath.stroke = "#04a700"
    } else { // look in the children
      curPath = curPath.children.find((x) => x.id === curSubpath.id);
      curPath.fill = "#99cc66";
      curPath.stroke = "#04a700"
    }
  }

  // set up the cartesianViz to look like the state (id - 1)
  let cartesianArr = curTree.allIncludingNonLeaf();
  cartesianArr.push(curTree.data); // include the root

  // append just the new node to be inserted 
  // without using the rbush's insert function ( so the bounding box of parents is not drawn )
  cartesianArr.push({ ...curNode, highlight: true });

  // redraw the viz with the new data
  drawViz(curTree, cartesianArr);
}

// a node step is clicked, e.g "N1"/"N2"
// id = index of the node
function fullStepClicked(id) {
  updateButtonStates(id, 'node');

  changeStep(id + 1);
}

// draw the steps on the left, clickable to bring the viz to that specific state
function drawSteps() {
  const stepsContainer = d3.select("#stepsContainer");
  const stepHGap = 10;
  const stepVGap = 15;

  // full steps
  const node = stepsContainer.selectAll(".stepNode")
    .data(rtreeSteps, function(d) { return d.node; })
  
  const stepNode = node.enter()
    .append("g")
    .attr("class", "stepNode")

  stepNode.append("rect")
    .attr("x", stepsWidth - margin - nodeWidth)
    .attr("y", (d, i) => (stepVGap + nodeHeight )* i)
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("fill", (d) => d.color || lightgray)
    .attr("stroke", darkgray)
    .attr("style", "cursor: pointer")
    .on("click", (d, obj) => {
      fullStepClicked(obj.id);
      drawSteps();
    })
    .transition()

  stepNode.append("text")
    .attr("x", stepsWidth - margin - (nodeWidth / 2) - 9)
    .attr("y", (d, i) => (stepVGap + nodeHeight ) * i)
    .attr("dy", ".92em")
    .text(d => {
      return d.node;
    })
    .attr("style", "pointer-events: none;");


  node.select("rect")
    .attr("fill", (d) => {
      return d.color || lightgray
    })
    
  node.exit().remove();

  // bbox steps

  const bboxNode = stepsContainer.selectAll(".bboxStep")
    .data(rtreeSteps, function(d) { return d.node; })
  
  const bboxNodeEnter = node.enter()
    .append("g")
    .attr("class", "bboxStep")

  bboxNodeEnter.append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => (stepVGap + nodeHeight )* i)
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("fill", (d) => d.subSteps.bbox ?  "skyblue" : lightgray)
    .attr("stroke", darkgray)
    .attr("style", "cursor: pointer")
    .on("click", (d, obj) => {
      bboxStepClicked(obj.id);
      drawSteps();
    })
    .transition()

  bboxNodeEnter.append("text")
    .attr("x", 2)
    .attr("y", (d, i) => (stepVGap + nodeHeight ) * i)
    .attr("dy", ".92em")
    .text("bbox")
    .attr("style", "pointer-events: none;");


  bboxNode.select("rect")
    .attr("fill", (d) => d.subSteps.bbox ?  "skyblue" : lightgray)
    
  bboxNode.exit().remove();

  // find steps

  const findNode = stepsContainer.selectAll(".findNode")
    .data(rtreeSteps, function(d) { return d.node; })
  
  const findNodeEnter = node.enter()
    .append("g")
    .attr("class", "findNode")

  findNodeEnter.append("rect")
    .attr("x", stepHGap + nodeWidth)
    .attr("y", (d, i) => (stepVGap + nodeHeight )* i)
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("fill", (d) => d.subSteps.find ?  "skyblue" : lightgray)
    .attr("stroke", darkgray)
    .attr("style", "cursor: pointer")
    .on("click", (d, obj) => {
      findStepClicked(obj.id);
      drawSteps();
    })
    .transition()

  findNodeEnter.append("text")
    .attr("x", stepHGap + nodeWidth + 4)
    .attr("y", (d, i) => (15 + nodeHeight ) * i)
    .attr("dy", ".92em")
    .text("find")
    .attr("style", "pointer-events: none;");


  findNode.select("rect")
    .attr("fill", (d) => d.subSteps.find ?  "skyblue" : lightgray)
    
  findNode.exit().remove();
}


// @@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@
// @@@@@@@@@@@@@@@@@@@@@@@



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

// draws the visualization based on the data passed to it.\
// rtree: RBush object
// optional cartesianArr, containing the rectangles to be drawn in the cartesian view.
// if empty, will construct one from the {rtree}
function drawViz(rtree = rtreeHistory[curStep], cartesianArr) {
  root = createRoot(rtree.data);

  drawTreeViz(rtree);

  if (cartesianArr) {
    drawCartesianViz(cartesianArr);
  } else {
    let rtreeArr = rtree.allIncludingNonLeaf();
    rtreeArr.push(rtree.data); // include the root
  
    drawCartesianViz(rtreeArr)
  }

}


// updates the visualization to a certain step. 
function changeStep(step) {
  if (step >= 0 && step <= rtreeHistory.length) {
    curStep = step; // step 1 is index 0 in the arr
  }

  // update the tree/cartesian arrays using the info
  // update the visualization 
  drawViz(rtreeHistory[curStep])
}

const rtreeInsertionOrder = [
  { node: "N1", id: 0, minX: 1, minY: 16, maxX: 3, maxY: 19, polygon: "./images/polygon-1.png"},
  { node: "N2", id: 1, minX: 3, minY: 12, maxX: 5, maxY: 14, polygon: "./images/polygon-4.png"}, // point
  { node: "N3", id: 2, minX: 4, minY: 4, maxX: 6, maxY: 8, polygon: "./images/polygon-2.png"},
  { node: "N4", id: 3, minX: 7, minY: 4, maxX: 8, maxY: 6, polygon: "./images/polygon-5.png"},
  { node: "N5", id: 4, minX: 5, minY: 9, maxX: 9, maxY: 11, polygon: "./images/polygon-3.png"},

  { node: "N6", id: 5, minX: 6, minY: 15, maxX: 10, maxY: 17, polygon: "./images/polygon-4.png"},
  { node: "N7", id: 6, minX: 11, minY: 16, maxX: 13, maxY: 19, polygon: "./images/polygon-5.png"},

  { node: "N8", id: 7, minX: 18, minY: 15, maxX: 19, maxY: 17, polygon: "./images/polygon-1.png"},
]

const rtreeSteps = structuredClone(rtreeInsertionOrder);

// data preprocessing for the data used for the steps visualization
for (let obj of rtreeSteps) {
  // for each object, add a "substep" object
  obj.subSteps = {
    find: false
  }
}
rtreeSteps[0].color = "skyblue";
rtreeSteps[0].subSteps = {
  find: true,
  bbox: true,
}


const RTREE_MAX_ENTRIES = 3;

// draw the elements that won't have to change with the data, e.g the viz border
function main() {
  let rbushe = new rbush(RTREE_MAX_ENTRIES);

  // empty tree
  let tempRTree = new rbush(RTREE_MAX_ENTRIES);
  console.log(tempRTree);
  tempRTree.data = {
    children: [],
    leaf: true,
    height: 0,
    width: 0,
    maxX: 9999,
    maxY: 9999,
    minX: 9999,
    minY: 999,
  }
  rtreeHistory.push(tempRTree);

  for (const obj of rtreeInsertionOrder) {
    rbushe.insert(obj);
    // creates a deep copy of the rtree, at this state, and store it in the history arr
    const tree = cloneTree(rbushe);
    rtreeHistory.push(tree);
  }

  // container for the entire component
  let mainContainer = d3.select("#rtree-container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

    
  // container for steps part of component, 
  let stepContainer = mainContainer
    .append("g")
    .attr("transform", `translate(${margin}, ${margin})`)
    .attr("id", "stepsContainer")

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
  .attr("transform", `translate(${width - vizWidth}, ${treeVizHeight})`)
  .attr("id", "cartesianVizContainer");

  setupCartesianViz();
  drawSteps();

  changeStep(curStep); 
}

main();
