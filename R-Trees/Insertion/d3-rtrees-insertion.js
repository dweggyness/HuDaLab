const width = 900;
const height = 600;

const controlsContainerHeight = 120;
const treeVizWidth = 500;
const cartesianVizWidth = width - treeVizWidth;

const borderWidth = 1.5;
const states = [];

let currentHoveredNode = null;

// when a node is hovered, highlight the node by scaling it and changing its colour
const onNodeHover = (node) => {
  const treeNode = d3.selectAll("#treeVizContainer > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node;
    }
    return false;
  });
  const cartesianNode = d3.selectAll("#cartesianVizContainer > g > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node;
    }
    return false;
  })

  treeNode.select("rect")
    .transition()
    .attr("fill", "yellow")
    .attr("transform", "scale(1.1)")
  treeNode.raise();

  cartesianNode.select("rect")
    .transition()
    .attr("fill", "yellow")
    .attr("transform", (d) => {
      if (d.width == 0.1 && d.height == 0.1) { // is point, scale more so its visible
        return "scale(2)";
      }
      return "scale(1.05)"
    });
  
  // hide the text of all other nodes in the cartesian plane, only show text of currently hovered node
  d3.selectAll("#cartesianVizContainer > g > g > text")
    .filter((d) => d.node !== node)
    .attr("style", "display: none;");
}

const onNodeUnhover = (node) => {
  const treeNode = d3.selectAll("#treeVizContainer > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node;
    }
    return false;
  });
  const cartesianNode = d3.selectAll("#cartesianVizContainer > g > g").filter((d) => {
    if (d && d.node !== undefined) {
      return d.node == node;
    }
    return false;
  })

  // reset scale/colour of the node, now that it is unhovered
  treeNode.select("rect")
    .transition()
    .attr("fill", "none")
    .attr("transform", "scale(1)");

  cartesianNode.select("rect")
    .transition()
    .attr("fill", "none")
    .attr("transform", "scale(1)");

  // display the text of all other nodes again
  d3.selectAll("#cartesianVizContainer > g > g > text")
    .filter((d) => d.node !== node)
    .attr("style", "display: block;");
}

// draw the tree view of the RTree, which is to the left
function drawTreeViz(rtree) {
  const vizContainer = d3.select("#vizContainer");
  const treeViz = vizContainer.append("g")
    .attr("id", "treeVizContainer");

  
  const nodeWidth = 40;
  const nodeHeight = 20;

  const layer1X = (treeVizWidth / 2) - (nodeWidth * 2 / 2);
  const layer2X = (treeVizWidth / 2) - ((nodeWidth * 5) / 2);
  const layer3X = (treeVizWidth / 2) - ((nodeWidth * 12) / 2);

  // construct the tree
  let nodes = treeViz
    .selectAll("g")
    .data(rtree)
    .enter()
    .append("g")

  nodes
    .append("rect")
    .attr("x", (d) => { 
      let layerXConst = layer1X;
      if (d.layer == 1) {
        layerXConst = layer1X;
      } else if (d.layer == 2) {
        layerXConst = layer2X;
      } else if (d.layer == 3) {
        layerXConst = layer3X;
      }
      return layerXConst + (d.order - 1) * nodeWidth;
    })
    .attr("y", (d) => 60 + (d.layer - 1) * 90)
    .attr("width", nodeWidth)
    .attr("height", nodeHeight)
    .attr("class", (d) => {
      if (!d.isGap) return "treeNode";
      return "";
    })
    .attr("fill", "none")
    .attr("style", (d) => {
      if (d.isGap) return "";
      return "outline: 2px solid black;"
    })
    .on('mouseover', (d, i) => {
      if (!i.isGap) {
        currentHoveredNode = i.node;
        onNodeHover(i.node);
      }
    })
    .on('mouseout', (d, i) => {
      if (!i.isGap) {
        currentHoveredNode = null;
        onNodeUnhover(i.node);
      }
    });
      
  nodes
    .append("text")
    .text((d) => { 
      if (d.node) return d.node;
      return "";
    })
    .attr("x", (d) => { 
      let layerXConst = layer1X;
      if (d.layer == 1) {
        layerXConst = layer1X;
      } else if (d.layer == 2) {
        layerXConst = layer2X;
      } else if (d.layer == 3) {
        layerXConst = layer3X;
      }
      return layerXConst + (d.order - 1) * nodeWidth + 10;
    })
    .attr("y", (d) => 60 + (d.layer - 1) * 90 + 15)
    .attr("style", "pointer-events: none;");

  nodes.exit().remove();

  // the links are hardcoded, just randomly tried out numbers until it looked good
  const links = [
    {source: [230, 80], target: [190, 150]},
    {source: [270, 80], target: [310, 150], id:"r2-child"},
    {source: [170, 170], target: [50, 240]},
    {source: [210, 170], target: [190, 240]},
    {source: [290, 170], target: [330, 240]},
    {source: [330, 170], target: [450, 240], id:"b4-child"},
  ]

  const arrowContainer = treeViz.append("g")
    .attr("id", "treeVizArrowContainer");

  for (let i = 0; i < links.length; i++) {
    let link = d3.linkVertical()
    .source(d => d.source)
    .target(d => d.target);

    arrowContainer
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", link)
    .attr("fill", "none")
    .attr("stroke", "black");
  }

  // let arrow = arrowGroups[j].enter()
  //   .append("path")
  //     .attr("class", "arrowGroup"+(j+1).toString())
  //     .attr("id", function(d, i) {
  //       return "arrow" + (j+1).toString() + d
  //     })
  //       .transition()
  //     .attr("d", link)
  //     .attr("stroke", "#000000");
}

function drawCartesianViz(rtree) {
  const vizContainer = d3.select("#vizContainer");
  const cartesianViz = vizContainer.append("g")
    .attr("transform", `translate(${treeVizWidth}, 0)`)
    .attr("id", "cartesianVizContainer");

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
    .attr("x", (d) => margin + d.x * scaleX)
    .attr("y", (d) => margin + d.y * scaleY)
    .attr("width", (d) => d.width * scaleX)
    .attr("height",(d) => d.height * scaleY)
    .attr("fill", "none")
    .attr("style", (d) => `outline: 2px solid ${d.color};`)
    .attr("class", "cartesianNode")
    .on('mouseover', (d, i) => {
      if (!i.isGap) {
        currentHoveredNode = i.node;
        onNodeHover(i.node);
      }
    })
    .on('mouseout', (d, i) => {
      if (!i.isGap) {
        currentHoveredNode = null;
        onNodeUnhover(i.node);
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
        return margin + d.x * scaleX + d.width * scaleX - 20;
      }
      return margin + d.x * scaleX + 5;
    })
    .attr("y", (d) => {
      if (d.textPlacement == "bottom") {
        return margin + d.y * scaleY + d.height * scaleY - 5;
      }
      return margin + d.y * scaleY + 20;
    })
    .attr("style", "pointer-events: none;");

  nodes.exit().remove();
}

function main() {
  // container for the entire component
  let mainContainer = d3.select("#rtree-container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height - controlsContainerHeight]);

  // add the dimensions for the control container
  d3.select(".controlsContainer")
    .attr("style", `width:${width}px; height:${controlsContainerHeight}px`);

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
    .attr("height", height - controlsContainerHeight - borderWidth * 2)
    .attr("fill", "none");


  // node: name of the node, layer: which layer its on, 1 being the highest
  // isGap: bool - empty node to provide spacing, order: the order of the node in each layer from L-R
  const rtree = [
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

  
  // list of objects containing the elems/nodes coordiantes in the cartesian plane
  // its a graph with axis 0-20, 0-20
  const rtree2 = [
    { node: "R1", x: 1, y: 4, width: 8, height: 15, color: "red" },
    { node: "R2", x: 6, y: 8, width: 13, height: 11, color: "red", textPlacement: "bottom" },

    { node: "B1", x: 1, y: 14, width: 4, height: 5, color: "teal" },
    { node: "B2", x: 4, y: 4, width: 5, height: 7, color: "teal" },
    { node: "B3", x: 6, y: 16, width: 8, height: 3, color: "teal", textPlacement: "bottom" },
    { node: "B4", x: 11, y: 8, width: 8, height: 4, color: "teal" },

    { node: "N1", x: 1, y: 16, width: 2, height: 3, color: "black" },
    { node: "N2", x: 5, y: 14, width: 0.1, height: 0.1, color: "black" }, // point
    { node: "N3", x: 4, y: 4, width: 2, height: 4, color: "black", textPlacement: "bottom"},
    { node: "N4", x: 7, y: 6, width: 0.1, height: 0.1, color: "black" },
    { node: "N5", x: 5, y: 9, width: 4, height: 2, color: "black" },

    { node: "N6", x: 6, y: 16, width: 5, height: 2, color: "black" },
    { node: "N7", x: 12, y: 16, width: 2, height: 3, color: "black" },

    { node: "N8", x: 11, y: 12, width: 0.1, height: 0.1, color: "black" },
    { node: "N9", x: 15, y: 8, width: 4, height: 3, color: "black" },

  ]


  drawTreeViz(rtree);
  drawCartesianViz(rtree2);

  // let cartesianVizContainer = vizContainer
  //   .insert("g")
  //   .attr("transform", "translate(500, 0)");

  // cartesianVizContainer
  //   .insert("rect")
  //   .attr("width", 400)
  //   .attr("height", 500)


  // controlsContainer.insert('text').attr("y", 50).text('hello wrold!');


  // const box = 
  // vizSection.insert("g")
  //   .attr("x", 50)
  //   .attr("y", 50)

  // box.insert("rect", "text")
  //     .attr("id", "box")
  //     .attr("width", '100px')
  //     .attr("height", '100px')
  //     .attr("fill", "#e0faec")
  //     .attr("stroke", "#3fbc77");

  // box.insert("text")
  //   .text("Hello World");
}

main();
