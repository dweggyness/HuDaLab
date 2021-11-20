
/** Implementation of Bloom Filters in JS */
// Based on https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/


// @@@@@@@@@@@@@@@@@@@@@
// set this to true if you want to see a step by step of commands being run
const DEBUG_FLAG = 0;

class BloomFilter {
  constructor(arrSize = 25) {
    this.arrSize = arrSize;
    this.array = []
    // initialize the array to be an array of 'zero bits' of size {this.size}
    for (let i = 0; i < this.arrSize; i++) {
      this.array[i] = 0
    }

    // an array containing the words inserted into the bloom filter. the actual implementation
    // shouldn't have this, but we will use this to help visualize false positives.
    this.arrayOfElems = []
  }

  // hash 1
  // linear adding, add ASCII code of each letter to it
  hash1(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++)
      {
          const curChar = str[i];
          const curCharASCII = curChar.charCodeAt(0)
          hash = hash + curCharASCII;
          hash = hash % this.arrSize;
      }
      return hash;
  }

  // hash 2
  // linear adding, add ASCII code of each letter * power of 19^(current index)
  hash2(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
    {
      const curChar = str[i];
      const curCharASCII = curChar.charCodeAt(0)
      hash = hash + Math.pow(19, i) * curCharASCII;
      hash = hash % this.arrSize;
    }
    return hash;
  }

  // hash 3
  // linear adding, multiply cur hash by 31, then add ASCII code of a letter
  hash3(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
    {
      const curChar = str[i];
      const curCharASCII = curChar.charCodeAt(0)
      hash = hash * 31 + curCharASCII;
      hash = hash % this.arrSize;
    }
    return hash;
  }

  // hashes a str on all the hash functions and returns it as an object
  hash(str) {
    const hash1 = this.hash1(str);
    const hash2 = this.hash2(str);
    const hash3 = this.hash3(str);

    if (DEBUG_FLAG) {
      console.log(`Hashing "${str}"`);
      console.log(`Hash1 - ${hash1}`);
      console.log(`Hash2 - ${hash2}`);
      console.log(`Hash3 - ${hash3}`);
    }

    return { hash1, hash2, hash3 }
  }

  // hashes the string, and sets the bits at the hash indexes to 1.
  insert(str) {
    if (DEBUG_FLAG) console.log(`Inserting "${str}"`);
    const { hash1, hash2, hash3 } = this.hash(str);

    this.array[hash1] = 1;
    this.array[hash2] = 1;
    this.array[hash3] = 1;

    if (DEBUG_FLAG) {
      console.log('Current BFT Bit Array - ')
      console.log(this.array);
    }

    this.arrayOfElems.push(str);
  }

  // Returns if the str's 3 hash results are 1 inside the bloom filter or not.
  // Three possible return values :
  // 'Positive' - True positive. The three bits are true, and it exists inside the bloom filter.
  // 'False Positive' - The three bits are true, but it does not exist inside the bloom filter.
  // 'Negative' - Not all three bits are true, it is guaranteed the str does not exist.
  find(str) {
    if (DEBUG_FLAG) console.log(`\nFinding "${str}" in BFT`);
    const { hash1, hash2, hash3 } = this.hash(str);

    // if all the bits are '1', its possible that the {str} exists in the bloom filter.
    if (this.array[hash1] && this.array[hash2] && this.array[hash3]) {
      if (this.arrayOfElems.includes(str)) { // it actually exists inside the bloom filter
        return 'Positive'
      } else {
        if (DEBUG_FLAG) console.log(this.array);
        return 'False Positive'
      }
    } else { // otherwise, its guaranteed that it does not exist.
      return 'Negative'
    }
  }

  deepcopyto(tempBFT) {
    tempBFT.arrSize = this.arrSize;
    tempBFT.array = JSON.parse(JSON.stringify(this.array));
    tempBFT.arrayOfElems = JSON.parse(JSON.stringify(this.arrayOfElems));
  }

  clean(arrSize) {
    this.arrSize = arrSize;
    this.array = [];
    // initialize the array to be an array of 'zero bits' of size {this.size}
    for (let i = 0; i < this.arrSize; i++) {
      this.array[i] = 0
    }

    // an array containing the words inserted into the bloom filter. the actual implementation
    // shouldn't have this, but we will use this to help visualize false positives.
    this.arrayOfElems = [];
  }

}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
// a function to shuffle input array, based on this stackoverflow answer
// Fisher-Yates (aka Knuth) Shuffle.
function shuffle(array) {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function main() {
  const BFT = new BloomFilter(20);

  const INPUT_ARRAY = [
    'cat', 'dog', 'fish', 'hippo', 'owl', 'tiger', 'elephant',
    'parrot', 'giraffe', 'chicken', 'hamster', 'sheep'
  ]

  shuffle(INPUT_ARRAY);

  // random insert X strings into the Bloom Filter
  // higher chance of false positives if you insert more elements
  // or if the BFT size is smaller

  // maximum of 12 elementts please theres only 12 elements in INPUT_ARRAY
  const NUM_ELEMS_TO_INSERT = 6;

  // random search for X strings into the Bloom Filter
  const NUM_ELEMS_TO_FIND = 10;

  if (DEBUG_FLAG) console.log("\n Inserting... \n \n");
  // insert into BFT.
  for (let i = 0; i < NUM_ELEMS_TO_INSERT; i++) {
    const strToInsert = INPUT_ARRAY[i];
    BFT.insert(strToInsert);
  }

  // reshuffle so you get new order of elements
  shuffle(INPUT_ARRAY);

  if (DEBUG_FLAG) {
    console.log("\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("\nDone Inserting.");
    console.log(" \n Finding...");
    console.log(`Words in the BFT : ${BFT.arrayOfElems}\n`);
  }
  // find from BFT
  for (let i = 0; i < NUM_ELEMS_TO_FIND; i++) {
    const str = INPUT_ARRAY[i];
    const findResult = BFT.find(str);
    if (DEBUG_FLAG) console.log(`Find Result: - ${findResult}`);
  }
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// main Viz helper functions
function getDataY(d, i) {
  return y = i*20
}
function getTextLocationY(d, i) {
  return 200 + (i-Math.floor((BFT.arrayOfElems.length)/2))*28;
}
function getTextLocation(d, i) {
  let x = 100;
  let y = getTextLocationY(d,i);
  return "translate(" + x + "," + y + ")"
}

// getbbox function
function findTextBBox(d) {
  return d3.select("#text" + d).node().getBBox();
}
function findHashStrBBox () {
  return d3.select("#hashStr").node().getBBox();
}
function findHash1BBox() {
  return d3.select("#hash1Res").node().getBBox();
}
function findHash2BBox() {
  return d3.select("#hash2Res").node().getBBox();
}
function findHash3BBox() {
  return d3.select("#hash3Res").node().getBBox();
}
function findFindBBox() {
  return d3.select("#findText").node().getBBox();
}
//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// initialize canvas
var width = 900;
var height = 600;
const padding = 10;
var margin = {
  top: padding,
  right: padding,
  bottom: padding,
  left: padding
};
width -= margin.left + margin.right;
height -= margin.top + margin.bottom;

const textBlockPaddingX = 4;
const textBlockPaddingY = 1;
const btnPaddingX = 1.5;
const btnPaddingY = 1.5;

// add container for BUTTONS
var btnDiv = document.createElement("div");
btnDiv.setAttribute("id", "button-container");
document.getElementById("bft-container").appendChild(btnDiv);

var svg = d3.select("#bft-container")
    .append("svg")
      .attr("width", 600 + 'px')
      // .attr("height", 600 + 'px')
      .attr("viewBox" , "0 0 900 600")
      // .attr("preserveAspectRatio","none")
      // .attr("width", width + margin.left + margin.right)
      // .attr("height", height + margin.top + margin.bottom)
      .attr("id", "canvas")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add container for main viz
let vizSection = svg
    .append("g")
      .attr("id", "viz-container")
      .attr("transform", "translate(50, 100)");

let arrayBGPart = vizSection.append("g").attr("class", "arrayBGPart");
let arrayPart = vizSection.append("g").attr("class", "arrayPart");
let arrowPart = vizSection.append("g").attr("class", "arrowPart");
let textPart = vizSection.append("g").attr("class", "textPart");

let hashPart = vizSection.append("g").attr("class", "hashPart");
let findPart = vizSection.append("g").attr("class", "findPart");

// display three hash functions;
let hash0Text = vizSection
    .append("text")
      .text("Hash")
      .attr("x", 500)
      .attr("y", -20)
      ;
let hash1Text = vizSection
    .append("text")
      .text("Hash function 1 result:")
      .attr("x", 500)
      .attr("y", 10)
      ;
let hash2Text = vizSection
    .append("text")
      .text("Hash function 2 result:")
      .attr("x", 500)
      .attr("y", 40)
      ;
let hash3Text = vizSection
    .append("text")
      .text("Hash function 3 result:")
      .attr("x", 500)
      .attr("y", 70)
      ;

let hashStr = vizSection
    .append("text")
      .attr("id", "hashStr")
      .text("string")
      .attr("x", 550)
      .attr("y", -20)
      ;
let hash1Result = vizSection
    .append("text")
      .attr("id", "hash1Res")
      .text("Res1")
      .attr("x", 675)
      .attr("y", 10)
      ;
let hash2Result = vizSection
    .append("text")
      .attr("id", "hash2Res")
      .text("Res2")
      .attr("x", 675)
      .attr("y", 40)
      ;
let hash3Result = vizSection
    .append("text")
      .attr("id", "hash3Res")
      .text("Res3")
      .attr("x", 675)
      .attr("y", 70)
      ;

let hashStrBBox = vizSection
    .insert("rect", "text")
      .attr("id", "hashStrBBox")
      .attr("class", "bBox")
      .attr("x", function () {
        return findHashStrBBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHashStrBBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHashStrBBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHashStrBBox().height + 2*textBlockPaddingY;
      })
      .attr("fill", "#e0faec")
      .attr("stroke", "#3fbc77");

let hash1BBox = vizSection
  .insert("rect", "text")
    .attr("id", "hash1ResBBox")
    .attr("class", "bBox")
    .attr("x", function () {
      return findHash1BBox().x - textBlockPaddingX;
    })
    .attr("y", function () {
      return findHash1BBox().y - textBlockPaddingY;
    })
    .attr("width", function () {
      return findHash1BBox().width + 2*textBlockPaddingX;
    })
    .attr("height", function () {
      return findHash1BBox().height + 2*textBlockPaddingY;
    })
    .attr("fill", "#e0faec")
    .attr("stroke", "#3fbc77");

let hash2BBox = vizSection
  .insert("rect", "text")
    .attr("id", "hash2ResBBox")
    .attr("class", "bBox")
    .attr("x", function () {
      return findHash2BBox().x - textBlockPaddingX;
    })
    .attr("y", function () {
      return findHash2BBox().y - textBlockPaddingY;
    })
    .attr("width", function () {
      return findHash2BBox().width + 2*textBlockPaddingX;
    })
    .attr("height", function () {
      return findHash2BBox().height + 2*textBlockPaddingY;
    })
    .attr("fill", "#e0faec")
    .attr("stroke", "#3fbc77");

let hash3BBox = vizSection
  .insert("rect", "text")
    .attr("id", "hash3ResBBox")
    .attr("class", "bBox")
    .attr("x", function () {
      return findHash3BBox().x - textBlockPaddingX;
    })
    .attr("y", function () {
      return findHash3BBox().y - textBlockPaddingY;
    })
    .attr("width", function () {
      return findHash3BBox().width + 2*textBlockPaddingX;
    })
    .attr("height", function () {
      return findHash3BBox().height + 2*textBlockPaddingY;
    })
    .attr("fill", "#e0faec")
    .attr("stroke", "#3fbc77");


const arraySize = 20;

const BFT = new BloomFilter(arraySize);
const INPUT_ARRAY = [
  'cat', 'dog', 'fish', 'hippo', 'owl', 'tiger', 'elephant',
  'parrot', 'giraffe', 'chicken', 'hamster', 'sheep'
]

let initialBFT = new BloomFilter(arraySize);
let bftRecord = [initialBFT];

var currIdx = 0;

var newIniNum;

drawViz(BFT);

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// User Initiate Numbers of Insertion
// create a seperate div for each interactive part
let userNumDiv = document.createElement("div");
userNumDiv.setAttribute("class", "btndiv");
userNumDiv.setAttribute("id", "divIniNum");
document.getElementById("button-container").appendChild(userNumDiv);

let userNum = document.createElement("INPUT");
userNum.setAttribute("type", "number");
userNum.setAttribute("placeholder", "Positive integer");
userNum.setAttribute("id", "userNum");
userNum.setAttribute("style", "width:150px");
userNum.addEventListener("keypress", (e) => {
  if (e.key == "Enter") {
    e.preventDefault();
    iniBFT();
  }
});

var numText = document.createElement("p");
numText.setAttribute("class", "btnText");
numText.innerHTML = "# of values to insert:";
document.getElementById("divIniNum").appendChild(numText);
document.getElementById("divIniNum").appendChild(userNum);


function iniBFT() {
  newIniNum = parseFloat(userNum.value);
  userNum.value = '';
  // check if num is valid
  if (newIniNum < 0 || newIniNum % 1 !== 0 || newIniNum > 12){
    alert("Please enter a valid number! \n A valid number is a Positve Integer smaller than 13.")
    newIniNum = null;
  } else {
    // reset BFT
    BFT.clean(arraySize);
    drawViz(initialBFT);
    drawText(initialBFT);
    // reset global variables
    bftRecord = [initialBFT];
    currIdx = 0;

    shuffle(INPUT_ARRAY);
    const NUM_ELEMS_TO_INSERT = newIniNum;
    // insert into BFT.
    for (let i = 0; i < NUM_ELEMS_TO_INSERT; i++) {
      currIdx++;

      const strToInsert = INPUT_ARRAY[i];
      // the following code is equivalent to:
      // BFT.insert(strToInsert);======================
      const { hash1, hash2, hash3 } = BFT.hash(strToInsert);

      BFT.array[hash1] = 1;
      BFT.array[hash2] = 1;
      BFT.array[hash3] = 1;

      BFT.arrayOfElems.push(strToInsert);
      // equivalent code ends ==========================

      let tempBFT = new BloomFilter(arraySize);
      BFT.deepcopyto(tempBFT);
      bftRecord.push(tempBFT);
    }
    drawViz(BFT);
    drawText(BFT);
  }
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// User Insert New Value
// create a seperate div for each interactive part
let userInsertDiv = document.createElement("div");
userInsertDiv.setAttribute("class", "btndiv");
userInsertDiv.setAttribute("id", "divInsert");
document.getElementById("button-container").appendChild(userInsertDiv);

var userInsert = document.createElement("INPUT");
userInsert.setAttribute("type", "text");
userInsert.setAttribute("placeholder", "Any String");
userInsert.setAttribute("id", "userInsert");
userInsert.setAttribute("style", "width:150px");
// upon pressing enter
userInsert.addEventListener("keypress", (e) => {
  if (e.key == "Enter") {
    e.preventDefault();
    insertValue();
  }
});

var insertText = document.createElement("p");
insertText.setAttribute("class", "btnText");
insertText.innerHTML = "Add another value: ";
document.getElementById("divInsert").appendChild(insertText);
document.getElementById("divInsert").appendChild(userInsert);

var newInsert;
function insertValue() {
  // check for duplicates
  var dup = false;
  newInsert = userInsert.value;
  userInsert.value = '';
  for (var i = 1; i < BFT.arrayOfElems.length; i++) {
    if (newInsert == BFT.arrayOfElems[i]) {
      dup = true;
    }
  }
  // check for insertion validty
  if (dup || newInsert.length > 20 || newInsert ==''){
    alert("Please enter a valid string! \n A valid number is a string having less than 20 letters that is not in the Bloom Filter.")
    newInsert = null;
  } else if (BFT.arrayOfElems.length > 20) {
    alert("Bloom Filter too full.")
    find = null;
  } else {

    // draw the last BFT
    drawViz(BFT);
    drawText(BFT);
    // get the last element idx
    currIdx = BFT.arrayOfElems.length;
    // set all previous text to active
    for (var i = 0; i <= currIdx; i++) {
      let d = BFT.arrayOfElems[i];
      d3.select("#textBBox" + d)
        .attr("stroke", "rebeccapurple")
        .attr("fill", "#f1ebff");
      d3.select("#text" + d)
        .attr("fill", "#000");
    }

    // insert into BFT.
    currIdx++;

    const strToInsert = newInsert;
    // the following code is equivalent to:
    // BFT.insert(strToInsert);======================
    const { hash1, hash2, hash3 } = BFT.hash(strToInsert);

    BFT.array[hash1] = 1;
    BFT.array[hash2] = 1;
    BFT.array[hash3] = 1;

    BFT.arrayOfElems.push(strToInsert);
    // equivalent code ends ==========================

    let tempBFT = new BloomFilter(arraySize);
    BFT.deepcopyto(tempBFT);
    bftRecord.push(tempBFT);
    drawViz(BFT);
    drawText(BFT);

    let t = document.getElementById("textGroup"+(currIdx-1).toString())

    textClicked(t, strToInsert);

    // because new arrows were added at the same time, js could not access the newly added arrows immediatelly, so we add a short delay.
    setTimeout(function () {
      // show arrow animations
      for (var i = 1; i < 4; i++) {
        let arrow = svg.select("#arrow"+i+strToInsert);
        arrow.each(function() {
          let tempArrow = arrowPart
            .append("path")
              .attr("class", "arrowAnimated")
              .attr("d", this.getAttribute('d'));
        })
      }
    }, 200);

  }
}


function drawViz(bft) {
  // remove animated line
  d3.selectAll(".arrowAnimated").remove();
  // remove finding path and rect
  d3.selectAll(".findingPath").remove();
  // remove hashed key
  hashStr.text("string");
  hash1Result.text("Res1");
  hash2Result.text("Res2");
  hash3Result.text("Res3");

  hashStrBBox
        .attr("x", function () {
          return findHashStrBBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHashStrBBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHashStrBBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHashStrBBox().height + 2*textBlockPaddingY;
        });

  hash1BBox
      .attr("x", function () {
        return findHash1BBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHash1BBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHash1BBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHash1BBox().height + 2*textBlockPaddingY;
      });

  hash2BBox
      .attr("x", function () {
        return findHash2BBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHash2BBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHash2BBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHash2BBox().height + 2*textBlockPaddingY;
      });

  hash3BBox
      .attr("x", function () {
        return findHash3BBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHash3BBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHash3BBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHash3BBox().height + 2*textBlockPaddingY;
      });

  drawArrayBG(bft);
  drawArray(bft);
  drawArrow(bft);
}

function drawArrayBG(bft) {

  let data = bft.array;
  let arrayBGGroup = arrayBGPart
      .selectAll(".arrayBGGroup")
        .data(data);

  let arrayBG = arrayBGGroup.enter()
      .append("g")
        .attr("class", "arrayBGGroup");

  arrayBG
      .append('rect')
        .attr("x", 250)
        .attr("y", getDataY)
        .attr("width", 25)
        .attr("height", 20)
        .attr("stroke", "#8c8c8c")
        .attr("fill", "#ececec");
}
function drawArray(bft) {
  let data = bft.array;

  let arrayGroup = arrayPart
      .selectAll(".arrayGroup")
        .data(data);

  let array = arrayGroup.enter()
      .append('rect')
        .attr("class", "arrayGroup")
        .attr("x", 250)
        .attr("y", getDataY)
        .attr("width", 25)
        .attr("height", 20)
        .attr("stroke", "#146396")
        .attr("fill", "#e0e9fa")
        // filter to only display 1 values
        .attr("display", d => d==0 ? "none":"block");

  let exitingArray = arrayGroup.exit();
  exitingArray.remove();

  // update
  arrayGroup.transition().attr("display", d => d==0 ? "none":"block");
}

function drawArrow(bft) {
  let data = bft.arrayOfElems;
  // arrows connecting text and array
  let arrowGroup1 = arrowPart.selectAll(".arrowGroup1").data(data,function (d,i) {
    return "arrow1"+d
  });
  let arrowGroup2 = arrowPart.selectAll(".arrowGroup2").data(data, function (d,i) {
    return "arrow2"+d
  });
  let arrowGroup3 = arrowPart.selectAll(".arrowGroup3").data(data, function (d,i) {
    return "arrow3"+d
  });

  // link 1
  let link1 = d3.linkHorizontal()
      .source(function (d,i) {
        y = getTextLocationY(d,i);
        return [100+2, y-5]
      })
      .target(function (d,i) {
        idx = bft.hash1(d);
        y = getDataY(d, idx);
        return [250, y+10]
      });

  let arrow1 = arrowGroup1.enter()
    .append("path")
      .attr("class", "arrowGroup1")
      .attr("id", function(d, i) {
        return "arrow1" + d
      })
        .transition()
      .attr("d", link1)
      .attr("stroke", "#000000");

  let exitingArrow1 = arrowGroup1.exit();
  exitingArrow1.remove();

  arrowGroup1.transition().attr("d", link1);

  // link 2
  let link2 = d3.linkHorizontal()
      .source(function (d,i) {
        y = getTextLocationY(d,i);
        return [100+2, y-5]
      })
      .target(function (d,i) {
        idx = bft.hash2(d);
        y = getDataY(d, idx);
        return [250, y+10]
      });

  let arrow2 = arrowGroup2.enter()
    .append("path")
      .attr("class", "arrowGroup2")
      .attr("id", function(d, i) {
        return "arrow2" + d
      })
        .transition()
      .attr("d", link2)
      .attr("stroke", "#000000");

  let exitingArrow2 = arrowGroup2.exit();
  exitingArrow2.remove();

  arrowGroup2.transition().attr("d", link2);

  // link 2
  let link3 = d3.linkHorizontal()
      .source(function (d,i) {
        y = getTextLocationY(d,i);
        return [100+2, y-5]
      })
      .target(function (d,i) {
        idx = bft.hash3(d);
        y = getDataY(d, idx);
        return [250, y+10]
      });

  let arrow3 = arrowGroup3.enter()
    .append("path")
      .attr("class", "arrowGroup3")
      .attr("id", function(d, i) {
        return "arrow3" + d
      })
        .transition()
      .attr("d", link3)
      .attr("stroke", "#000000");

  let exitingArrow3 = arrowGroup3.exit();
  exitingArrow3.remove();

  arrowGroup3.transition().attr("d", link3);

}

// timer for differentiatign doubling clicking and clicking
// from https://css-tricks.com/snippets/javascript/bind-different-events-to-click-and-double-click/
var timer = 0;
var clickDelay = 200;
var prevent = false;

function drawText(bft) {
  let data = bft.arrayOfElems;
  let textGroup = textPart
      .selectAll(".textGroup")
        .data(data, function (d,i) {
          return "text"+d
        });

  let texts = textGroup.enter()
      .append("g")
        .attr("class", "textGroup")
        .attr("id", function(d,i) {
          return "textGroup" + i;
        })
        .attr("transform", getTextLocation)
        .on("click", function(a,d) {
          let t = this;
          timer = setTimeout(function() {
            if (!prevent) {
              textClicked(t, d);
            }
            prevent = false;
          }, clickDelay);
        })
        .on("dblclick", function(a,d) {
          clearTimeout(timer);
          prevent = true;
          textDblClicked(this, d);
        });

  texts
      .append("text")
        .attr("class", "text textBtn")
        .attr("id", function(d,i) {
          return "text" + d;
        })
        .text(d => d)
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#000000");

  texts
      .insert('rect','text')
        .attr("class", "bBox")
        .attr("id", d => "textBBox"+d)
        .attr("x", function (d,i) {
          return findTextBBox(d).x - btnPaddingX*2;
        })
        .attr("y", function (d,i) {
          return findTextBBox(d).y - btnPaddingY;
        })
        .attr("width", function (d,i) {
          return findTextBBox(d).width + 2*btnPaddingX*2;
        })
        .attr("height", function (d,i) {
          return findTextBBox(d).height + 2*btnPaddingY;
        })
        .attr("stroke", "rebeccapurple")
        .attr("fill", "#f1ebff");

  let exitingTexts = textGroup.exit();
  exitingTexts.remove();

  // update
  textGroup.transition().attr("transform", getTextLocation);
}

function textClicked(t,d) {
  console.log("clicked");
  if (currIdx >= parseInt(t.getAttribute("id").substring(9))+1) {
    // remove animated line
    d3.selectAll(".arrowAnimated").remove();
    // show hash results
    d3.select("#hashStr").text(d);
    d3.select("#hashStrBBox")
        .attr("x", function () {
          return findHashStrBBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHashStrBBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHashStrBBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHashStrBBox().height + 2*textBlockPaddingY;
        });
    d3.select("#hash1Res").text(bftRecord[currIdx].hash1(d));
    d3.select("#hash1ResBBox")
        .attr("x", function () {
          return findHash1BBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHash1BBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHash1BBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHash1BBox().height + 2*textBlockPaddingY;
        });
    d3.select("#hash2Res").text(bftRecord[currIdx].hash2(d));
    d3.select("#hash2ResBBox")
        .attr("x", function () {
          return findHash2BBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHash2BBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHash2BBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHash2BBox().height + 2*textBlockPaddingY;
        });
    d3.select("#hash3Res").text(bftRecord[currIdx].hash3(d));
    d3.select("#hash3ResBBox")
        .attr("x", function () {
          return findHash3BBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHash3BBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHash3BBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHash3BBox().height + 2*textBlockPaddingY;
        });
    // show arrow animations
    for (var i = 1; i < 4; i++) {
      let arrow = svg.select("#arrow"+i+d);
      arrow.each(function() {
        let tempArrow = arrowPart
          .append("path")
            .attr("class", "arrowAnimated")
            .attr("d", this.getAttribute('d'));
      })
    }

  }
}
function textDblClicked(t, d) {
  console.log("dblclicked");
  currIdx = parseInt(t.getAttribute("id").substring(9))+1;
  // revert to BFT of this stage.
  drawViz(bftRecord[currIdx]);

  // set all previous to active
  for (var i = 0; i <= currIdx; i++) {
    let d = BFT.arrayOfElems[i];
    d3.select("#textBBox" + d)
      .attr("stroke", "rebeccapurple")
      .attr("fill", "#f1ebff");
    d3.select("#text" + d)
      .attr("fill", "#000");
  }
  // set all later to inactive
  for (var i = currIdx; i < BFT.arrayOfElems.length; i++) {
    let d = BFT.arrayOfElems[i];
    d3.select("#textBBox" + d)
      .attr("stroke", "#8c8c8c")
      .attr("fill", "#ececec");
    d3.select("#text" + d)
      .attr("fill", "#8c8c8c");
  }
}


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// User Find Key
// create a seperate div for each interactive part
let userFindDiv = document.createElement("div");
userFindDiv.setAttribute("class", "btndiv");
userFindDiv.setAttribute("id", "divFind");
document.getElementById("button-container").appendChild(userFindDiv);

var userFind = document.createElement("INPUT");
userFind.setAttribute("type", "text");
userFind.setAttribute("placeholder", "Any String");
userFind.setAttribute("id", "userInsert");
userFind.setAttribute("style", "width:150px");
userFind.addEventListener("keypress", (e) => {
  if (e.key == "Enter") {
    e.preventDefault();
    findValue();
  }
});
var findText = document.createElement("p");
findText.setAttribute("class", "btnText");
findText.innerHTML = "Find a value: ";
document.getElementById("divFind").appendChild(findText);
document.getElementById("divFind").appendChild(userFind);


function findValue() {
  let find = userFind.value;

  // clear the input field.
  userFind.value = '';

  // check for validty
  if (find.length > 20 || newInsert ==''){
    alert("Please enter a valid string! \n A valid number is a string with less than 20 letters.")
    find = null;
  } else {
    // remove finding
    d3.selectAll(".finding").remove();

    let findGroup = findPart.append("g")
        .attr("class", "finding")
        .attr("id", "findGroup")
        .attr("transform", "translate(400,200)")
          .on("click", function () {
            drawFind(find);
          });

    findGroup
      .append("text")
        .text(find)
        .attr("id", "findText")
        .attr("class", "textBtn finding");

    findGroup
      .insert("rect", "text")
        .attr("class", "bBox")
        .attr("x", function () {
          return findFindBBox().x - btnPaddingX*2;
        })
        .attr("y", function () {
          return findFindBBox().y - btnPaddingY;
        })
        .attr("width", function () {
          return findFindBBox().width + 2*btnPaddingX*2;
        })
        .attr("height", function () {
          return findFindBBox().height + 2*btnPaddingY;
        })
        .attr("stroke", "rebeccapurple")
        .attr("fill", "#f1ebff");

    // just drawFind, so user don;t need to click on it to show
    drawFind(find);
  }
}

function drawFind(find) {
  let currBFT = bftRecord[currIdx];
  let found = null;
  const { hash1, hash2, hash3 } = currBFT.hash(find);

  // if all the bits are '1', its possible that the {str} exists in the bloom filter.
  if (currBFT.array[hash1] && currBFT.array[hash2] && currBFT.array[hash3]) {
    if (currBFT.arrayOfElems.includes(find)) { // it actually exists inside the bloom filter
      found = 'Positive';
    } else {
      found = 'False Positive';
    }
  } else { // otherwise, its guaranteed that it does not exist.
    found = 'Negative';
  }

  // draw arrow ===============================================
  // remove finding path and rect
  d3.selectAll(".findingPath").remove();
  // link 1
  let link1 = d3.linkHorizontal();
  let link1Target = [275, getDataY(null, hash1)+10];
  let link1Data = {source:[400-2, 200-5], target: link1Target};
  findPart
    .append("path")
      .attr("class", "finding findingPath")
      .attr("d", link1(link1Data))
      .attr("stroke", "#000000");

  // link 2
  let link2 = d3.linkHorizontal();
  let link2Target = [275, getDataY(null, hash2)+10];
  let link2Data = {source:[400-2, 200-5], target: link2Target};
  findPart
    .append("path")
      .attr("class", "finding findingPath")
      .attr("d", link2(link2Data))
      .attr("stroke", "#000000");

  // link 3
  let link3 = d3.linkHorizontal();
  let link3Target = [275, getDataY(null, hash3)+10];
  let link3Data = {source:[400-2, 200-5], target: link3Target};
  findPart
    .append("path")
      .attr("class", "finding findingPath")
      .attr("d", link3(link3Data))
      .attr("stroke", "#000000");

  // draw Array
  // location corresponding to hash1
  if (!currBFT.array[hash1]) {
    findPart
      .append('rect')
        .attr("class", "finding findingPath")
        .attr("x", 250)
        .attr("y", getDataY(null, hash1))
        .attr("width", 25)
        .attr("height", 20)
        .attr("stroke", "orange")
        .attr("fill", "#fce5d3");
  }
  // location corresponding to hash1
  if (!currBFT.array[hash2]) {
    findPart
      .append('rect')
        .attr("class", "finding findingPath")
        .attr("x", 250)
        .attr("y", getDataY(null, hash2))
        .attr("width", 25)
        .attr("height", 20)
        .attr("stroke", "orange")
        .attr("fill", "#fce5d3");
  }
  // location corresponding to hash1
  if (!currBFT.array[hash3]) {
    findPart
      .append('rect')
        .attr("class", "finding findingPath")
        .attr("x", 250)
        .attr("y", getDataY(null, hash3))
        .attr("width", 25)
        .attr("height", 20)
        .attr("stroke", "orange")
        .attr("fill", "#fce5d3");
  }

  // update hash result
  hashStr.text(find);
  hash1Result.text(hash1);
  hash2Result.text(hash2);
  hash3Result.text(hash3);

  hashStrBBox
      .attr("x", function () {
        return findHashStrBBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHashStrBBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHashStrBBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHashStrBBox().height + 2*textBlockPaddingY;
      });

  hash1BBox
      .attr("x", function () {
        return findHash1BBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHash1BBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHash1BBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHash1BBox().height + 2*textBlockPaddingY;
      });

  hash2BBox
      .attr("x", function () {
        return findHash2BBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHash2BBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHash2BBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHash2BBox().height + 2*textBlockPaddingY;
      });

  hash3BBox
      .attr("x", function () {
        return findHash3BBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHash3BBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHash3BBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHash3BBox().height + 2*textBlockPaddingY;
      });

  // result & explanation
  let message1 = "";
  let message2 = "";
  let message3 = "";
  switch (found) {
    case "Positive":
      message1 = "Because all of the hashed position is occupied,";
      message2 = "the searched value is probably there.";
      message3 = "In fact, it is a Positive but it's not definite."
      break;
    case "False Positive":
      message1 = "Because all of the hashed position is occupied,";
      message2 = "the searched value is probably there.";
      message3 = "In fact, it is a False Positive."
      break;

    case "Negative":
      message1 = "Because at least one of the hashed position is empty,";
      message2 = "the searched value is definitely not in the bloom filter.";
      message3 = "";
      break;

  }
  findPart.append("text")
    .text(message1)
    .attr("class", "finding findingPath")
    .attr("x", 380)
    .attr("y", 250)
    .attr("font-size", "1.1em");
  findPart.append("text")
    .text(message2)
    .attr("class", "finding findingPath")
    .attr("x", 380)
    .attr("y", 275)
    .attr("font-size", "1.1em");
  findPart.append("text")
      .text(message3)
      .attr("class", "finding findingPath")
      .attr("x", 380)
      .attr("y", 300)
      .attr("font-size", "1.1em");


}
