const width = 900;
const height = 600;

const controlsContainerHeight = 120;
const treeVizWidth = 500;
const cartesianVizWidth = width - treeVizWidth;

const borderWidth = 2;
const states = [];

let currentHoveredNode = null;

function createTreeNode(text, size) {
  const node = d3.create("g")

  node.append("rect")
    .attr("width", size.width)
    .attr("height", size.height)
    .attr("fill", "none")
    .attr("style", "outline: 2px solid black;");

  node.append('text')
    .text(text)
    .attr("y", size.height / 2);

  return node
}

function drawTreeViz() {
  const vizContainer = d3.select("#vizContainer");

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
  
  const nodeWidth = 40;
  const nodeHeight = 20;

  const layer1X = (treeVizWidth / 2) - (nodeWidth * 2 / 2);
  const layer2X = (treeVizWidth / 2) - ((nodeWidth * 5) / 2);
  const layer3X = (treeVizWidth / 2) - ((nodeWidth * 12) / 2);

  // construct the tree
  let nodes = vizContainer
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
    .on('mouseover', (d) => currentHoveredNode = d.node)
    .on('mouseout', (d) => currentHoveredNode = null);
      
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
    .attr("y", (d) => 60 + (d.layer - 1) * 90 + 15 );

  nodes.exit().remove();

  // the links are hardcoded, just randomly tried out numbers until it looked good
  const links = [
    {source: [230, 80], target: [190, 150]},
    {source: [270, 80], target: [310, 150], id:"r2-children"},
    {source: [170, 170], target: [50, 240]},
    {source: [210, 170], target: [190, 240]},
    {source: [290, 170], target: [330, 240]},
    {source: [330, 170], target: [450, 240]},
  ]

  for (let i = 0; i < links.length; i++) {
    let link = d3.linkVertical()
    .source(d => d.source)
    .target(d => d.target);

    vizContainer
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

function drawCartesianViz() {

}

function main() {
  // container for the entire component
  let mainContainer = d3.select("#rtree-container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height - controlsContainerHeight]);

  d3.select(".controlsContainer")
    .attr("style", `width:${width}px; height:${controlsContainerHeight}px`);


  // container for top part of component, incl playback buttons and step explainer
  let controlsContainer = mainContainer.insert("g")

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

  drawTreeViz();

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
