// declare Bucket & LHT class

/** Implementation of Linear Dynamic Hashing Tables in JS */
// Based on http://queper.in/drupal/blogs/dbsys/linear_hashing




// @@@@@@@@@@@@@@@@@@@@@@
// structure of this.directories
// in illustration below, let the numbers denote which bucket an index in this.directories is pointing to
// example: assuming no elements inside, we just expand globalDepth
// "0", "1"
// [0, 1] -- globalDepth 1
// "00", "01", "10", "11"
// [0, 1, 0, 1] -- globalDepth 2
// "000", "001", "010", "011", "100", "101", "110", "111"
// [0, 1, 0, 1, 0, 1, 0, 1] -- globalDepth 3

// the indexing is done in i + arraySize/2 manner whenever the directories is expanded/doubled
// so [0, 1], after expanding you get [0, 1, X, X]
// so index[2], points towards index[0] as thats what you get when you offset it by half the new size of the array
// index[3] points towards index[1], etc as the array grwos

const bucketSize = 4;

// @@@@@@@@@@@@@@@@@@@@@
// set this to true if you want to see a step by step of commands being run
const DEBUG_FLAG = 1;

class Bucket {
  constructor() {
    this.data = {};
    this.overflowPage;
    this.hasOverFlowPage = false;
  }

  isFull() {
    if (Object.keys(this.data).length >= bucketSize){
      return true;
    }
    return false;
  }

  insert(key, value) {
    if (this.isFull()) {
      // bucket is full, create overflow page if it does not exist
      if(this.hasOverFlowPage == false) {
        this.overflowPage = new Bucket();
        this.hasOverFlowPage = true;
      }
      // bucket is full, insert into overflow page
      this.overflowPage.insert(key, value);
    } else {
      this.data[key] = value;
    }
  }

  // returns an object containing key,val pairs for every item in this bucket,
  // and all items in overflowPages, and any further nested overflowPages.
  getItems() {
    let items = this.data;
    if (this.hasOverFlowPage) {
      let overflowItems = this.overflowPage.getItems();
      items = { ...items, ...overflowItems };
    }

    return items;
  }

  as1DArray() {
    return Object.keys(this.data);
  }

  clear() {
    this.data = {};
    this.overflowPage = null;
    this.hasOverFlowPage = false;
  }
}

class LinearHashingTable {
  constructor() {
    this.round = 0;
    this.splitPointer = 0;
    this.numBuckets = 4;
    this.buckets = [new Bucket(), new Bucket(), new Bucket(), new Bucket()];
  }

  /* Hashes {data} based on {round} and returns the hashed result
  // Current hash function: H = data % (2^(1 + this.round))
  @param {int} data - The input to be hashed
  @param {int} round - Used to augment the hash function
  // Default: round = this.round
  @returns {string} Hashed data.
  */
  hash(data, round = this.round) {
    const hashedData = data % (Math.pow(2, round) * this.numBuckets);
    return hashedData;
  }

  getIndex(data) {
    // get the index of the bucket that this data belongs to by hashing it
    const hashedData = this.hash(data, this.round);
    let bucketKey = hashedData;

    if (DEBUG_FLAG) console.log(`Hash(${data} % ${Math.pow(2, this.round) * this.numBuckets}) = ${bucketKey}`);

    // if the bucket is before the splitPointer, hash it again using h_i+1
    if (bucketKey < this.splitPointer) {
      bucketKey = this.hash(data, this.round + 1);
      if (DEBUG_FLAG) console.log(`Hash ${bucketKey} is before splitpointer, ${this.splitPointer}.
      Rehash using H_i+1(${data} % ${Math.pow(2, 1+ this.round) * this.numBuckets}) = ${bucketKey}`);
    }

    return bucketKey;
  }

  /* Splits bucket with ID {this.splitPointer} into two buckets
  */
  splitBucket() {

    if (DEBUG_FLAG) console.log(`Split bucket ${this.splitPointer}`);
    const bucket = this.buckets[this.splitPointer];

    // make a copy of the data in the bucket
    const tempData = JSON.parse(JSON.stringify(bucket.getItems()));
    // clear the bucket
    this.buckets[this.splitPointer].clear();

    // create a new bucket in the bucketlist
    this.buckets.push(new Bucket());

    // rehash and reinsert the items of the bucket
    for (var [key, val] of Object.entries(tempData)) {
      const hashedKey = this.hash(key, this.round + 1);
      this.buckets[hashedKey].insert(key, val);
    }

    // increment splitPointer
    this.splitPointer++;
    // if splitPointer equal to numBuckets, increment this.round, reset this.splitPointer
    if (this.splitPointer === Math.pow(2, this.round) * this.numBuckets) {
      if (DEBUG_FLAG) console.log(`Splitpointer ${this.splitPointer} equal to num buckets. Splitpointer reset, round incremented.`);
      this.round++;
      this.splitPointer = 0;
    }
  }

  /* Inserts {data}, hashing it before inserting into the table
  @param {int} data - The input to be inserted
  */
  insertIntoTable(data) {
    const key = this.getIndex(data);

    const bucket = this.buckets[key];
    if (DEBUG_FLAG) console.log(`Insert ${data} into bucket ${key}`);

    if (bucket.isFull()) {
      if (DEBUG_FLAG) console.log(`Bucket full`);
      bucket.insert(data, data);
      this.splitBucket();
    } else {
      bucket.insert(data, data);
    }

    if (DEBUG_FLAG) this.display();
  }

  /* takes a new EHT as param, deepcopy from original EHT to a new EHT object.
  */
  deepcopyto(tempLHT) {
    let buckets = [];
    for (var i = 0; i < this.buckets.length; i++) {
      let bucket = this.buckets[i];
      let newBucket = new Bucket();
      newBucket.data = JSON.parse(JSON.stringify(bucket.data));
      newBucket.hasOverFlowPage = bucket.hasOverFlowPage;
      if (bucket.hasOverFlowPage) {
        newBucket.overflowPage = new Bucket();
        newBucket.overflowPage.hasOverFlowPage = bucket.overflowPage.hasOverFlowPage;
        newBucket.overflowPage.data = JSON.parse(JSON.stringify(bucket.overflowPage.data));
      }
      buckets[i] = newBucket;
    }
    tempLHT.round = this.round;
    tempLHT.splitPointer = this.splitPointer;
    tempLHT.numBuckets = this.numBuckets;
    tempLHT.buckets = buckets;
  }

  /* Cleans LHT, reset this.buckets, i.e. reinitialize LHT
  */
  clean() {
    this.round = 0;
    this.splitPointer = 0;
    this.numBuckets = 4;
    this.buckets = [new Bucket(), new Bucket(), new Bucket(), new Bucket()];
  }

  // helper function to display and debug and look around
  display() {
    console.log("Round: ", this.round, " Splitpointer: ", this.splitPointer, " Bucket size:", bucketSize, "\n");
    for (var i = 0; i < this.buckets.length; i++) {
      // hardcoded way to show SINGLE overflowpage, doesnt work if theres two overflow pages for a single bucket
      if (this.buckets[i].hasOverFlowPage) {
        console.log(i + ' - ' + (this.splitPointer === i ? ' sp ': ''), (this.buckets[i].as1DArray()), ' --> ', this.buckets[i].overflowPage.as1DArray());
      } else {
        console.log(i + ' - ' + (this.splitPointer === i ? ' sp ': ''), (this.buckets[i].as1DArray()));
      }
    }
  }
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// input: buckets is an array of Bucket instances
function flatOutBuckets(buckets) {
  let flatted = [];
  for (var i = 0; i < buckets.length; i++) {
    let currentBucket = Object.entries(buckets[i].data);
    for (var j = 0; j < currentBucket.length; j++) {
      flatted.push({
        "key": currentBucket[j][0],
        "value": currentBucket[j][1],
        "bucket": i,
        "order": j,
        "overflow": false,
      });
    }
    if (buckets[i].hasOverFlowPage) {
      let overflowPage = Object.entries(buckets[i].overflowPage.data);
      for (var j = 0; j < overflowPage.length; j++) {
        flatted.push({
          "key": overflowPage[j][0],
          "value": overflowPage[j][1],
          "bucket": i,
          "order": j,
          "overflow": true,
        });
      }
    }
  }
  return flatted
}

// main Viz helper functions
function getKeyLocation(d, i) {
  let y = 100 + i * 25;
  return "translate(" + 10 + ", " + y + ")"
}
function getKeyIniLocation(d, i) {
  let y = 100 + i * 25;
  return "translate(" + -50 + ", " + y + ")"
}
function getBucketLocation(d) {
  let x = 0;
  let y = 0;
  if (d["overflow"]) {
    x += 150;
  }
  x += 50 + d["order"] * 30;
  y += 100 + d["bucket"] * 25;
  return "translate(" + x + ", " + y + ")"
}
function getBucketBGLocation(d, i) {
  let x = 50;
  let y = 100 + i * 25;
  return "translate(" + x + ", " + y + ")"
}
function getSplitLocation(d) {
  return "translate(" + -10 + ", " + d*25 + ")"
}
function getPointerLocation(d) {
  return "translate(" + -10 + ", " + d*25 + ")"
}
// processlog helper functions =========================================
function findLogBtnY(idx) {
  idx = idx - 1;
  return idx*28
}

// bbox helper functions ===============================================
function findHashBBox(idx) {
  return d3.select("#hashBtn" + idx).node().getBBox();
}
function findHash2BBox(idx) {
  return d3.select("#hash2Btn" + idx).node().getBBox();
}
function findInsertBBox(idx) {
  return d3.select("#insertBtn" + idx).node().getBBox();
}
function findSplit1BBox(idx) {
  return d3.select("#split1Btn" + idx).node().getBBox();
}
function findSplit2BBox(idx) {
  return d3.select("#split2Btn" + idx).node().getBBox();
}
function findPointerBBox() {
  return d3.select("#splitPointer").node().getBBox();
}
function findRoundBBox() {
  return d3.select("#round").node().getBBox();
}
function findHashingBBox() {
  return d3.select("#hashingValue").node().getBBox();
}
function findHashedBBox() {
  return d3.select("#hashedValue").node().getBBox();
}
function findSplitHashBBox(i) {
  return d3.select("#splitHash"+i).node().getBBox();
}
function findPlayAllBBox() {
  return d3.select("#playAllBtn").node().getBBox();
}
function findFind1BBox() {
  return d3.select("#find1Btn").node().getBBox();
}
function findFind2BBox() {
  return d3.select("#find2Btn").node().getBBox();
}
function findFindNumBBox() {
  return d3.select("#findNum").node().getBBox();
}

// update btn color helper function
// i: insertIdx
// state: true/false. true for clicked, false for unclicked.
function changeThisStageBtn(i, state) {
  let refer = ["#hashBtn", "#hash2Btn", "#insertBtn", "#split1Btn", "#split2Btn", "#hashed"];
  for (var j = 0; j < refer.length; j++) {
    if (state) {
      d3.select(refer[j]+i).attr("class", "textBtn clickedText");
      d3.select(refer[j]+"BBox"+i).attr("class", "bBox clickedBBox");
    } else {
      d3.select(refer[j]+i).attr("class", "textBtn unclickedText");
      d3.select(refer[j]+"BBox"+i).attr("class", "bBox unclickedBBox");
    }

  }
}
function changeBtnColor(idx, btn) {

  // change previous btns to clicked
  for (var i = 1; i < idx; i++) {
    changeThisStageBtn(i, true);
  }
  // change later btns to unclicked
  for (var i = idx; i < insertLog.length; i++) {
    changeThisStageBtn(i, false);
  }
  // change btns of this stage
  switch(btn) {
    case "hash":
      d3.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");

      d3.select("#hashed"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashedBBox"+idx).attr("class", "bBox clickedBBox");
      break;
    case "hash2":
      d3.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#hash2Btn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hash2BtnBBox"+idx).attr("class", "bBox clickedBBox");

      d3.select("#hashed"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashedBBox"+idx).attr("class", "bBox clickedBBox");
      break;
    case "insert":
      d3.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#hash2Btn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hash2BtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#insertBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#insertBtnBBox"+idx).attr("class", "bBox clickedBBox");

      d3.select("#hashed"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashedBBox"+idx).attr("class", "bBox clickedBBox");
      break;
    case "split1":
      d3.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#hash2Btn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hash2BtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#insertBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#insertBtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#split1Btn"+idx).attr("class", "textBtn clickedText");
      d3.select("#split1BtnBBox"+idx).attr("class", "bBox clickedBBox");

      d3.select("#hashed"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashedBBox"+idx).attr("class", "bBox clickedBBox");
      break;
    case "split2":
      d3.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#hash2Btn"+idx).attr("class", "textBtn clickedText");
      d3.select("#hash2BtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#insertBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#insertBtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#split1Btn"+idx).attr("class", "textBtn clickedText");
      d3.select("#split1BtnBBox"+idx).attr("class", "bBox clickedBBox");
      d3.select("#split2Btn"+idx).attr("class", "textBtn clickedText");
      d3.select("#split2BtnBBox"+idx).attr("class", "bBox clickedBBox");

      d3.select("#hashed"+idx).attr("class", "textBtn clickedText");
      d3.select("#hashedBBox"+idx).attr("class", "bBox clickedBBox");
      break;
  }

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
document.getElementById("lht-container").appendChild(btnDiv);


var svg = d3.select("#lht-container")
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
      .attr("transform", "translate(400, 50)");
// add container for process log
let processLog = svg
    .append("g")
      .attr("id", "process-container")
      .attr("transform", "translate(0, 70)");

// add container for split
let splitSection = svg
    .append("g")
      .attr("id", "split-container")
      .attr("transform", "translate(700, 50)");

// add container for find key
let findSection = svg
    .append("g")
      .attr("id", "find-container")
      .attr("transform", "translate(50, 20)");

let keyPart = vizSection.append("g").attr("class", "keyPart");
// let arrowPart = vizSection.append("g").attr("class", "arrowPart");
let bucketBGPart = vizSection.append("g").attr("class", "bucketBGPart");
let bucketPart = vizSection.append("g").attr("class", "bucketPart");
let pointerPart = vizSection.append("g").attr("class", "pointerPart")
      // hide split pointer at first
      .attr("opacity", "0");
let paramPart = vizSection.append("g").attr("class", "paramPart")
      .attr("transform", "translate(0,-50)");
let textPart = vizSection.append("g").attr("class", "textPart")
      .attr("transform", "translate(-100,20)");;

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// splitPointer
pointerPart
    .append("text")
      .attr("id", "splitPointer")
      .text("Split Pointer →")
      .attr("text-anchor", "middle")
      .attr("x", -60)
      .attr("y", 100)
      .attr("fill", "#000000");
pointerPart
    .insert("rect", "text")
      .attr("id", "splitPointerBBox")
      .attr("class", "bBox")
      .attr("x", function () {
        return findPointerBBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findPointerBBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findPointerBBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findPointerBBox().height + 2*textBlockPaddingY;
      })
      .attr("fill", "#e0faec")
      .attr("stroke", "#3fbc77");

// round (temp name)
paramPart.append("text")
    .text("Round: ")
      .attr("x", -130)
      .attr("y", 30)
      .attr("fill", "#000000");

let round = paramPart.append("text")
    .text("0")
    .attr("id", "round")
    .attr("x", -60)
    .attr("y", 30)
    .attr("fill", "#000000");
let roundBBox = paramPart.insert("rect", "text")
    .attr("id", "splitPointerBBox")
    .attr("class", "bBox")
    .attr("x", function () {
      return findRoundBBox().x - textBlockPaddingX;
    })
    .attr("y", function () {
      return findRoundBBox().y - textBlockPaddingY;
    })
    .attr("width", function () {
      return findRoundBBox().width + 2*textBlockPaddingX;
    })
    .attr("height", function () {
      return findRoundBBox().height + 2*textBlockPaddingY;
    })
    .attr("fill", "#e0faec")
    .attr("stroke", "#3fbc77");

// hash function
paramPart.append("text")
    .text("Hash Function: ")
    .attr("x", -20)
    .attr("y", 30)
    .attr("fill", "#000000");

let hashingValue = paramPart.append("text")
    .text("xx")
    .attr("text-anchor", "middle")
    .attr("id", "hashingValue")
    .attr("x", 110)
    .attr("y", 30);

let hashingValueBBox = paramPart.insert("rect", "text")
    .attr("class", "bBox")
      .attr("x", function () {
        return findHashingBBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHashingBBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHashingBBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHashingBBox().height + 2*textBlockPaddingY;
      })
      .attr("fill", "#e0faec")
      .attr("stroke", "#3fbc77");

paramPart.append("text")
    .text("% (2 \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 × 4) = ")
    .attr("x", 130)
    .attr("y", 30)
    .attr("fill", "#000000");
paramPart.append("text")
    .attr("id", "round_inFormula")
    .text("round")
    .attr("x", 165)
    .attr("y", 20)
    .attr("font-size", 14)
    .attr("fill", "#000000");

let hashedValue = paramPart.append("text")
    .text("p")
    .attr("text-anchor", "middle")
    .attr("id", "hashedValue")
    .attr("x", 270)
    .attr("y", 30);

let hashedValueBBox = paramPart.insert("rect", "text")
    .attr("class", "bBox")
      .attr("x", function () {
        return findHashedBBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHashedBBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHashedBBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHashedBBox().height + 2*textBlockPaddingY;
      })
      .attr("fill", "#e0faec")
      .attr("stroke", "#3fbc77");



//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
function drawViz(lht) {


  drawKeys(lht);
  drawValues(lht);

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // update splitPointer
  pointerPart.attr("opacity", "100");
  pointerPart.transition().attr("transform", function () {
    return getPointerLocation(lht.splitPointer)
  });
  // update round
  round.transition().text(lht.round);
  roundBBox.transition().attr("width", function () {
    return findRoundBBox().width + 2*textBlockPaddingX
  });
  // reset hashing value
  hashingValue.transition().text("xx");
  hashedValue.transition().text("p");

  //rest round_inFormula
  d3.select("#round_inFormula").text("round").attr("fill", "#000");
  // remove previous highlighted key
  d3.selectAll(".keyText").attr("fill","#000");

  // remove hashed keys in spliting
  d3.selectAll(".spliting").remove();

  // remove double hashing text
  d3.selectAll(".hash2text").remove();



}

function drawKeys(lht) {
  console.log(lht);
  let bucketData = lht.buckets;
  // keys
  let keyGroup = keyPart
      .selectAll(".keyGroup")
        .data(bucketData, function(d,i) {
          return "key" + i;
        });

  let keys = keyGroup.enter()
    .append('g')
      .attr("class", "keyGroup");

  keys
      .append("text")
        .attr("class", "keyText")
        .attr("id", function(d,i) {
          return "key" + i;
        })
        .text(function(d,i) {
          return i
        })
        .attr("text-anchor", "middle")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#000000");

  keys
      .insert('rect','text')
        .attr("class", "keyBBox bBox")
        .attr("x", -15)
        .attr("y", -15.5)
        .attr("width", 30)
        .attr("height", 20)
        .attr("stroke", "rebeccapurple")
        .attr("fill", "#f1ebff");

  keys.attr("transform", getKeyIniLocation).transition().attr("transform", getKeyLocation);

  let exitingKeys = keyGroup.exit();
  exitingKeys.remove();

  // update
  keyGroup.transition().attr("transform", getKeyLocation);

  //empty buckets background
  let bucketBGGroup = bucketBGPart
      .selectAll(".bucketBGGroup")
      .data(bucketData, function (d, i) {
        return "buckets" + i
      })
  let buckets = bucketBGGroup.enter()
    .append("rect")
      .attr("class", "bucketBGGroup bBox")
      .attr("x", -15)
      .attr("y", -18)
      .attr("width", 120)
      .attr("height", 25)
      .attr("stroke", "#8c8c8c")
      .attr("fill", "#ececec")
      .attr("transform", getBucketBGLocation);

  let exitingBuckets = bucketBGGroup.exit();
  exitingBuckets.remove();

  bucketBGGroup.transition().attr("transform", getBucketBGLocation);

}

function drawValues(lht) {
  let bucketData = lht.buckets;
  // buckets & values
  let flattedData = flatOutBuckets(bucketData);
  console.log(flattedData);

  // set all old values bbox to be blue
  d3.selectAll(".valueBBox")
    .attr("stroke", "#146396")
    .attr("fill", "#e0e9fa");

  // values
  let valueGroup = bucketPart
      .selectAll(".valueGroup")
      .data(flattedData, function(d,i){
        return "value" + d['key']
      });

  let values = valueGroup.enter()
    .append('g')
      .attr('class', "valueGroup")

  values
      .append("text")
        .text(d => d["key"])
        .attr("id", d => "value" + d["key"])
        .attr("text-anchor", "middle")
        .attr('class', "valueTexts")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#000000");

  values.insert("rect", "text")
    .attr("id", d => "valueBBox" + d["key"])
    .attr("class", "valueBBox bBox")
    .attr("x", -15)
    .attr("y", -15.5)
    .attr("width", 30)
    .attr("height", 20)
    .attr("stroke", "#146396")
    .attr("fill", "#e0e9fa");


  values.transition().attr("transform", getBucketLocation);

  //exitingValues
  let exitingValues = valueGroup.exit();
  exitingValues.remove();

  // update
  d3.selectAll(".valueTexts").transition().attr("x", 0).attr("y",0);
  d3.selectAll(".valueBBox").transition().attr("x", -15).attr("y", -15.5)
  valueGroup.transition().attr("transform", getBucketLocation);
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
function showNum(idx) {
  processLog
    .append("text")
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "hashed"+idx;
      })
      .text(insertLog[idx])
      .attr("text-anchor", "middle")
      .attr("x", 235)
      .attr("y", function() {
        return findLogBtnY(idx)
      })
      .on("click", function () {
        if (!playAllClicked) {
          numClicked(idx);
        }
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "hashedBBox"+idx
      })
      .attr("x", 235-15)
      .attr("y", function () {
        return findLogBtnY(idx)-15.5;
      })
      .attr("width", 30)
      .attr("height", 20);
}
function numClicked(idx) {
  // draw previous step
  drawViz(lhtRecord[idx-1]);
  hashClicked(idx);
  if (stateHash2[idx]) {
    setTimeout(function () {
      hash2Clicked(idx);
      if (stateSplit[idx]) {
        setTimeout(function () {
          fullInsertClicked(idx);
          setTimeout(function () {
            split1Clicked(idx);
            setTimeout(function () {
              split2Clicked(idx);
            }, 1000);
          }, 1000);
        }, 1000);
      } else {
        setTimeout(function () {
          insertClicked(idx);
        }, 1000);
      }
    }, 1000);
  } else {
    if (stateSplit[idx]) {
      setTimeout(function () {
        fullInsertClicked(idx);
        setTimeout(function () {
          split1Clicked(idx);
          setTimeout(function () {
            split2Clicked(idx);
          }, 1000);
        }, 1000);
      }, 1000);
    } else {
      setTimeout(function () {
        insertClicked(idx);
      }, 1000);
    }
  }
}

function showHash(idx) {
  processLog
    .append("text")
      .text("hash")
      .attr("x", 0)
      .attr("y", function () {
        return findLogBtnY(idx)
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "hashBtn" + idx
      })
      .on("click", function () {
        if (!playAllClicked) {
          // draw previous step
          drawViz(lhtRecord[idx-1]);
          hashClicked(idx);
        }
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "hashBtnBBox"+idx
      })
      .attr("x", function () {
        return findHashBBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findHashBBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findHashBBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findHashBBox(idx).height + 2*btnPaddingY;
      });
}
function hashClicked(idx) {


  let hashedKey = lhtRecord[idx-1].hash(insertLog[idx]);
  hashingValue.transition().text(insertLog[idx]);
  hashingValueBBox.transition().attr("width", function () {
    return findHashingBBox().width + 2*textBlockPaddingX
  });
  hashedValue.transition().text(hashedKey);
  hashedValueBBox.transition().attr("width", function () {
    return findHashedBBox().width + 2*textBlockPaddingX
  });


  if (stateHash2[idx]) {
    // text support
    textPart.append("text")
      .attr("class", "hash2text")
      .text("Hashed key " + hashedKey + " is smaller than the split pointer " + lhtRecord[idx].splitPointer + ".")
      .attr("x", 0)
      .attr("y", 0)
      .attr("fill", "#000000")
    ;

    textPart.append("text")
      .attr("class", "hash2text")
      .text("This bucket has been splitted, so we need to hash again using round+1.")
      .attr("x", 0)
      .attr("y", 20)
      .attr("fill", "#000000")
    ;
  }


  // highlight corresponding key
  d3.select("#key"+hashedKey).transition().attr("fill","#f00");

  // change btn color;
  changeBtnColor(idx, "hash");
}

function showHash2(idx) {
  processLog
    .append("text")
      .text("hash")
      .attr("x", 42)
      .attr("y", function () {
        return findLogBtnY(idx)
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "hash2Btn" + idx
      })
      .on("click", function () {
        if (!playAllClicked) {
          // draw previous step
          drawViz(lhtRecord[idx-1]);
          hash2Clicked(idx);
        }
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "hash2BtnBBox"+idx
      })
      .attr("x", function () {
        return findHash2BBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findHash2BBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findHash2BBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findHash2BBox(idx).height + 2*btnPaddingY;
      });
}
function hash2Clicked(idx) {

  let prevHashedKey = lhtRecord[idx-1].hash(insertLog[idx], lhtRecord[idx-1].round);
  let hashedKey = lhtRecord[idx-1].hash(insertLog[idx], lhtRecord[idx-1].round+1);

  hashingValue.transition().text(insertLog[idx]);
  hashingValueBBox.transition().attr("width", function () {
    return findHashingBBox().width + 2*textBlockPaddingX
  });
  hashedValue.transition().text(hashedKey);
  hashedValueBBox.transition().attr("width", function () {
    return findHashedBBox().width + 2*textBlockPaddingX
  });

  //change round to round + 1
  d3.select("#round_inFormula").transition().text("round+1").attr("fill", "#f00");

  // highlight corresponding key
  d3.select("#key"+hashedKey).transition().attr("fill","#f00");

  // text support
  textPart.append("text")
    .attr("class", "hash2text")
    .text("Hashed key " + prevHashedKey + " is smaller than the split pointer " + lhtRecord[idx].splitPointer + ".")
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "#000000")
  ;

  textPart.append("text")
    .attr("class", "hash2text")
    .text("This bucket has been splitted, so we need to hash again using round+1.")
    .attr("x", 0)
    .attr("y", 20)
    .attr("fill", "#000000")
  ;

  // change btn color;
  changeBtnColor(idx, "hash2");
}

function showInsert(idx) {
  processLog
    .append("text")
      .text("insert")
      .attr("x", () => stateHash2[idx] ? 84:42)
      .attr("y", function () {
        return findLogBtnY(idx)
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "insertBtn" + idx
      })
      .on("click", function () {
        if (!playAllClicked) {
          stateSplit[idx] ? fullInsertClicked(idx):insertClicked(idx)
        }
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "insertBtnBBox"+idx
      })
      .attr("x", function () {
        return findInsertBBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findInsertBBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findInsertBBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findInsertBBox(idx).height + 2*btnPaddingY;
      });
}
function insertClicked(idx) {
  if (stateHash2[idx]) {
    hash2Clicked(idx);
  } else {
    hashClicked(idx);
  }
  drawViz(lhtRecord[idx]);
  //set the inserting value to be highlighted
  d3.select("#valueBBox"+insertLog[idx]).attr("stroke", "orange")
      .attr("fill", "#fce5d3");
  // change btn color;
  changeBtnColor(idx, "insert");
}

function fullInsertClicked(idx) {
  if (stateHash2[idx]) {
    hash2Clicked(idx);
  } else {
    hashClicked(idx);
  }
  drawViz(stateSplit[idx]);

  // text support
  textPart.append("text")
    .attr("class", "spliting")
    .text("Overflow detected. We need to split bucket.")
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "#000000")
  ;

  textPart.append("text")
    .attr("class", "spliting")
    .text("Because split pointer is pointing at bucket " + stateSplit[idx].splitPointer + ", we split bucket " + stateSplit[idx].splitPointer +'.')
    .attr("x", 0)
    .attr("y", 20)
    .attr("fill", "#000000")
  ;


  //set the inserting value to be highlighted
  d3.select("#valueBBox"+insertLog[idx]).attr("stroke", "orange")
      .attr("fill", "#fce5d3");
  // change btn color;
  changeBtnColor(idx, "insert");
}

function showSplit1(idx) {
  processLog
    .append("text")
      .text("rehash")
      .attr("x", () => stateHash2[idx] ? 130.5:88.5)
      .attr("y", function () {
        return findLogBtnY(idx)
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "split1Btn" + idx
      })
      .on("click", function () {
        if (!playAllClicked) {
          split1Clicked(idx);
        }
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "split1BtnBBox"+idx
      })
      .attr("x", function () {
        return findSplit1BBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findSplit1BBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findSplit1BBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findSplit1BBox(idx).height + 2*btnPaddingY;
      });
}
function split1Clicked(idx) {
  if (stateHash2[idx]) {
    hash2Clicked(idx);
  } else {
    hashClicked(idx);
  }
  fullInsertClicked(idx);

  let bucketToSplit = stateSplit[idx].buckets[stateSplit[idx].splitPointer];
  let tempData = Object.entries(
    JSON.parse(JSON.stringify(bucketToSplit.getItems()))
  );

  // set up two temporary buckets
  let gp1 = [];
  let gp2 = [];
  let first;
  for (var i = 0; i < tempData.length; i++) {
    const hashedKey = lhtRecord[idx-1].hash(tempData[i][1], lhtRecord[idx-1].round + 1);
    if (hashedKey==stateSplit[idx].splitPointer) {
      gp1.push(tempData[i][1]);
    } else {
      gp2.push(tempData[i][1]);
    }
  }
  var gp1Counter = 0;
  var gp2Counter = 0;
  var gp1BBoxCounter = 0;
  var gp2BBoxCounter = 0;
  var gp1HashCounter = 0;
  var gp2HashCounter = 0;

  for (var i = 0; i < tempData.length; i++) {
    let v = d3.select("#value" + tempData[i][1]);
    let g = v.select(function() { return this.parentNode; });
    console.log(g);
    g.transition().attr("transform", "");

    d3.select("#value" + tempData[i][1]).transition()
      .attr("x", function () {
        return 300;
      })
      .attr("y", function () {
        if (gp1.includes(tempData[i][1])) {
          loc = gp1Counter;
          gp1Counter++;
        } else {
          loc = gp2Counter + 6;
          gp2Counter++;
        }
        return 100+loc*25;
      });

    d3.select("#valueBBox" + tempData[i][1]).transition()
      .attr("x", function () {
        return 300-15;
      })
      .attr("y", function () {
        if (gp1.includes(tempData[i][1])) {
          loc = gp1BBoxCounter;
          gp1BBoxCounter++;
        } else {
          loc = gp2BBoxCounter + 6;
          gp2BBoxCounter++;
        }
        return 100+loc*25-15;
      });

    const hashedKey = lhtRecord[idx-1].hash(tempData[i][1], lhtRecord[idx-1].round + 1);
    splitSection.append("text")
      .text(hashedKey)
      .attr("class", "spliting")
      .attr("id", function () {
        return "splitHash" + i
      })
      // .transition()
        .attr("x", 50)
        .attr("y", function () {
          if (gp1.includes(tempData[i][1])) {
            loc = gp1HashCounter;
            gp1HashCounter++;
          } else {
            loc = gp2HashCounter + 6;
            gp2HashCounter++;
          }
          return 100+loc*25;
        });

    splitSection.insert("rect", "text")
      .attr("class", "bBox spliting")
      .attr("x", function () {
        return findSplitHashBBox(i).x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findSplitHashBBox(i).y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findSplitHashBBox(i).width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findSplitHashBBox(i).height + 2*textBlockPaddingY;
      })
      .attr("fill", "#e0faec")
      .attr("stroke", "#3fbc77");

  }

  drawKeys(lhtRecord[idx]);

  // change btn color;
  changeBtnColor(idx, "split1");
}

function showSplit2(idx) {
  processLog
    .append("text")
      .text("split")
      .attr("x", () => stateHash2[idx] ? 186:144)
      .attr("y", function () {
        return findLogBtnY(idx);
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "split2Btn" + idx
      })
      .on("click", function () {
        if (!playAllClicked) {
          split2Clicked(idx);
        }
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "split2BtnBBox"+idx
      })
      .attr("x", function () {
        return findSplit2BBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findSplit2BBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findSplit2BBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findSplit2BBox(idx).height + 2*btnPaddingY;
      });
}
function split2Clicked(idx) {
  if (stateHash2[idx]) {
    hash2Clicked(idx);
  } else {
    hashClicked(idx);
  }
  drawViz(lhtRecord[idx]);
  //set the inserting value to be highlighted
  d3.select("#valueBBox"+insertLog[idx]).attr("stroke", "orange")
      .attr("fill", "#fce5d3");

  // change btn color;
  changeBtnColor(idx, "split2");
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// global variables and states
const LHT = new LinearHashingTable();

let initialLHT = new LinearHashingTable();
LHT.deepcopyto(initialLHT);
let lhtRecord = [initialLHT];

var insertIdx = 0;
let insertLog = [null];
let stateHash2 = [null];
let stateSplit = [null];

var animationCounter = 1;

var newIniNum;

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
    iniLHT();
  }
});

var numText = document.createElement("p");
numText.setAttribute("class", "btnText");
numText.innerHTML = "# of keys to insert:";
document.getElementById("divIniNum").appendChild(numText);
document.getElementById("divIniNum").appendChild(userNum);


function iniLHT() {
  newIniNum = parseFloat(userNum.value);
  userNum.value = '';
  // check if num is valid
  if (newIniNum < 0 || newIniNum % 1 !== 0){
    alert("Please enter a valid number! \n A valid number is a Positve Integer.")
    newIniNum = null;
  } else {
    // reset LHT
    LHT.clean();

    // change canvas size
    desHeight =  600 + Math.max(0, newIniNum-18)*28;
    desViewBox = "0 0 900 " + desHeight;
    document.getElementById("canvas").setAttribute("viewBox", desViewBox);

    // reset global variables
    lhtRecord = [initialLHT];
    insertIdx = 0;
    insertLog = [null];
    stateHash2 = [null];
    stateSplit = [null];
    animationCounter = 1;


    // clear process log
    d3.select("#process-container").selectAll("*").remove();



    const NUM_ELEMS_TO_INSERT = newIniNum;
    // insert (10 to NUM_ELEMS_TO_INSERT + 10) into the table in a random order
    let arrayOfNums = [];
    const startingNum = 10;
    for (var i = startingNum; i < NUM_ELEMS_TO_INSERT + startingNum; i++) {
      arrayOfNums[i - startingNum] = i + 1;
    }
    for (var i = startingNum; i< NUM_ELEMS_TO_INSERT + startingNum; i++ ) {
      const val = arrayOfNums[Math.floor(Math.random() * arrayOfNums.length)];
      arrayOfNums = arrayOfNums.filter(function(elem) { return elem !== val })

      //update states
      insertIdx++;

      // LHT.insertIntoTable(val);
      // code equivalent to LHT.insertIntoTable(val):=======================

        // const key = LHT.getIndex(val);
        // code equivalent to const key = LHT.getIndex(val):=======================
        const hashedData = LHT.hash(val, LHT.round);
        let key = hashedData;
        if (key < LHT.splitPointer) {
          key = LHT.hash(val, LHT.round + 1);
          showHash2(insertIdx);
          stateHash2.push(true);
        } else {
          stateHash2.push(false);
        }

      insertLog.push(val);

      const bucket = LHT.buckets[key];

      if (bucket.isFull()) {
        bucket.insert(val, val);

        let tempLHT = new LinearHashingTable();
        LHT.deepcopyto(tempLHT);
        stateSplit.push(tempLHT);

        LHT.splitBucket();
        // call viz function
        showNum(insertIdx);
        showHash(insertIdx);
        showInsert(insertIdx);
        showSplit1(insertIdx);
        showSplit2(insertIdx);
      } else {
        stateSplit.push(false);

        bucket.insert(val, val);
        // call viz function
        showNum(insertIdx);
        showHash(insertIdx);
        showInsert(insertIdx);
      }
      // equivalent code ends =============================================

      let tempLHT = new LinearHashingTable();
      LHT.deepcopyto(tempLHT);
      lhtRecord.push(tempLHT);
    }
    drawViz(LHT);
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
userInsert.setAttribute("type", "number");
userInsert.setAttribute("placeholder", "Positive integer");
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
insertText.innerHTML = "Add another key: ";
document.getElementById("divInsert").appendChild(insertText);
document.getElementById("divInsert").appendChild(userInsert);

var newInsert;
function insertValue() {
  // check for duplicates
  var dup = false;
  newInsert = parseFloat(userInsert.value);
  userInsert.value = '';
  for (var i = 1; i < insertLog.length; i++) {
    if (newInsert == insertLog[i]) {
      dup = true;
    }
  }
  // check for insertion validty
  if (newInsert < 0 || newInsert % 1 !== 0 || dup){
    alert("Please enter a valid number! \n A valid number is a Positve Integer that is not in the Extendible Hashing Table")
    newInsert = null;
  } else {
    //update states
    insertIdx++;

    // change canvas size
    desHeight =  600 + Math.max(0, insertIdx-18)*28;
    desViewBox = "0 0 900 " + desHeight;
    document.getElementById("canvas").setAttribute("viewBox", desViewBox);


    // LHT.insertIntoTable(val);
    // code equivalent to LHT.insertIntoTable(val):=======================

      // const key = LHT.getIndex(val);
      // code equivalent to const key = LHT.getIndex(val):=======================
      let val = newInsert;
      const hashedData = LHT.hash(val, LHT.round);
      let key = hashedData;
      if (key < LHT.splitPointer) {
        key = LHT.hash(val, LHT.round + 1);
        showHash2(insertIdx);
        stateHash2.push(true);
      } else {
        stateHash2.push(false);
      }

    insertLog.push(val);

    const bucket = LHT.buckets[key];

    if (bucket.isFull()) {
      bucket.insert(val, val);

      let tempLHT = new LinearHashingTable();
      LHT.deepcopyto(tempLHT);
      stateSplit.push(tempLHT);

      LHT.splitBucket();
      // call viz function
      showNum(insertIdx);
      showHash(insertIdx);
      showInsert(insertIdx);
      showSplit1(insertIdx);
      showSplit2(insertIdx);
    } else {
      stateSplit.push(false);

      bucket.insert(val, val);
      // call viz function
      showNum(insertIdx);
      showHash(insertIdx);
      showInsert(insertIdx);
    }
    // equivalent code ends =============================================

    let tempLHT = new LinearHashingTable();
    LHT.deepcopyto(tempLHT);
    lhtRecord.push(tempLHT);
  }
  drawViz(LHT);
}


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// User Find Key
// create a seperate div for each interactive part
let userFindDiv = document.createElement("div");
userFindDiv.setAttribute("class", "btndiv");
userFindDiv.setAttribute("id", "divFind");
document.getElementById("button-container").appendChild(userFindDiv);

var userFind = document.createElement("INPUT");
userFind.setAttribute("type", "number");
userFind.setAttribute("placeholder", "Positive integer");
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
findText.innerHTML = "Find a key: ";
document.getElementById("divFind").appendChild(findText);
document.getElementById("divFind").appendChild(userFind);

function findValue() {
  let find = parseFloat(userFind.value);

  // clear the input field.
  userFind.value = '';
  // check for available
  var found = false;
  for (var i = 1; i < insertLog.length; i++) {
    if (find == insertLog[i]) {
      found = true;
    }
  }
  // check for validty
  if (find < 0 || find % 1 !== 0 || !found){
    alert("Please enter a valid number! \n A valid number is a Positve Integer that is IN the extendible hashing table.")
    find = null;
  } else {
    // remove finding
    d3.selectAll(".finding").remove();

    const hashedData = LHT.hash(find, LHT.round);
    let bucketKey = hashedData;
    // if the bucket is before the splitPointer, hash it again using h_i+1
    if (bucketKey < LHT.splitPointer) {
      bucketKey = LHT.hash(find, LHT.round + 1);
      showFind1(find, bucketKey, true);
      showFind2(find, bucketKey);
      showFindNum(find, bucketKey, true);
    } else {
      showFind1(find, bucketKey, false);
      showFindNum(find, bucketKey, false);
    }

  }
}
function showFindNum(find, bucketKey, sec) {
  findSection
    .append("text")
      .attr("class", "finding textBtn unclickedText")
      .attr("id", "findNum")
      .text(find)
      .attr("text-anchor", "middle")
      .attr("x", 175)
      .attr("y", 10)
      .on("click", function () {
        findNumClicked(find, bucketKey, sec);
      });;

  findSection
    .insert("rect", "text")
      .attr("class", "finding bBox unclickedBBox")
      .attr("id", "findNumBBox")
      .attr("x", 175-15)
      .attr("y", -5.5)
      .attr("width", 30)
      .attr("height", 20);
}
function findNumClicked(find, bucketKey, sec) {
  // draw the last viz
  drawViz(lhtRecord.slice(-1)[0]);
  find1Clicked(find, bucketKey, sec);
  if (sec) {
    setTimeout(function () {
      find2Clicked(find, bucketKey);
    }, 1000);
  }
}
function showFind1(find, bucketKey, sec) {
  findSection
    .append("text")
      .attr("class", "finding textBtn unclickedText")
      .attr("id", "find1Btn")
      .text("find")
      .attr("x", 80)
      .attr("y", 10)
      .on("click", function () {
        // draw the last viz
        drawViz(lhtRecord.slice(-1)[0]);
        find1Clicked(find, bucketKey, sec);
      });

  findSection
    .insert("rect", ".finding")
      .attr("class", "finding bBox unclickedBBox")
      .attr("id", "find1BtnBBox")
      .attr("x", function () {
        return findFind1BBox().x - btnPaddingX;
      })
      .attr("y", function () {
        return findFind1BBox().y - btnPaddingY;
      })
      .attr("width", function () {
        return findFind1BBox().width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findFind1BBox().height + 2*btnPaddingY;
      });
}
function find1Clicked(find, bucketKey, sec) {
  d3.selectAll(".unclickedText").attr("class", "textBtn clickedText");
  d3.selectAll(".unclickedBBox").attr("class", "bBox clickedBBox");

  d3.select("#findNum").attr("class", "finding textBtn clickedText");
  d3.select("#findNumBBox").attr("class", "finding bBox clickedBBox");
  d3.select("#find1Btn").attr("class", "finding textBtn clickedText");
  d3.select("#find1BtnBBox").attr("class", "finding bBox clickedBBox");
  d3.select("#find2Btn").attr("class", "finding textBtn unclickedText");
  d3.select("#find2BtnBBox").attr("class", "finding bBox unclickedBBox");

  hashingValue.transition().text(find);
  hashingValueBBox.transition().attr("width", function () {
    return findHashingBBox().width + 2*textBlockPaddingX
  });
  hashedValue.transition().text(bucketKey);
  hashedValueBBox.transition().attr("width", function () {
    return findHashedBBox().width + 2*textBlockPaddingX
  });

  // highlight corresponding key
  d3.select("#key"+bucketKey).transition().attr("fill","#f00");

  // if not second hash, highlight value
  d3.select("#valueBBox"+find)
    .transition()
      .attr("fill", "#fce5d3")
      .attr("stroke", "orange");
}
function showFind2(find, bucketKey) {
  findSection
    .append("text")
      .attr("class", "finding textBtn unclickedText")
      .attr("id", "find2Btn")
      .text("find")
      .attr("x", 114)
      .attr("y", 10)
      .on("click", function () {
        // draw the last viz
        drawViz(lhtRecord.slice(-1)[0]);
        find2Clicked(find, bucketKey);
      });

  findSection
    .insert("rect", ".finding")
      .attr("class", "finding bBox unclickedBBox")
      .attr("id", "find2BtnBBox")
      .attr("x", function () {
        return findFind2BBox().x - btnPaddingX;
      })
      .attr("y", function () {
        return findFind2BBox().y - btnPaddingY;
      })
      .attr("width", function () {
        return findFind2BBox().width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findFind2BBox().height + 2*btnPaddingY;
      });
}
function find2Clicked(find, bucketKey) {
  d3.selectAll(".unclickedText").attr("class", "textBtn clickedText");
  d3.selectAll(".unclickedBBox").attr("class", "bBox clickedBBox");

  d3.select("#findNum").attr("class", "finding textBtn clickedText");
  d3.select("#findNumBBox").attr("class", "finding bBox clickedBBox");
  d3.select("#find1Btn").attr("class", "finding textBtn clickedText");
  d3.select("#find1BtnBBox").attr("class", "finding bBox clickedBBox");
  d3.select("#find2Btn").attr("class", "finding textBtn clickedText");
  d3.select("#find2BtnBBox").attr("class", "finding bBox clickedBBox");

  hashingValue.transition().text(find);
  hashingValueBBox.transition().attr("width", function () {
    return findHashingBBox().width + 2*textBlockPaddingX
  });
  hashedValue.transition().text(bucketKey);
  hashedValueBBox.transition().attr("width", function () {
    return findHashedBBox().width + 2*textBlockPaddingX
  });

  //change round to round + 1
  d3.select("#round_inFormula").transition().text("round+1").attr("fill", "#f00");

  // highlight corresponding key
  d3.select("#key"+bucketKey).transition().attr("fill","#f00");

  // highlight corresponding value
  d3.select("#valueBBox"+find)
    .transition()
      .attr("fill", "#fce5d3")
      .attr("stroke", "orange");
}

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// play all
// add play all BUTTON
var playAllClicked = false;

let playAllBtn = svg.append("text")
    .text("Play All")
    .attr("id", "playAllBtn")
    .attr("class", "textBtn")
    .attr("x", 10)
    .attr("y", 30)
    .on("click", function () {
      if (!playAllClicked) {
        playAllClicked = true;
        playAll();
      }
    });

let playAllBtnBbox = svg.insert("rect", "#playAllBtn")
    .attr("x", function () {
      return findPlayAllBBox().x - textBlockPaddingX;
    })
    .attr("y", function () {
      return findPlayAllBBox().y - textBlockPaddingY;
    })
    .attr("width", function () {
      return findPlayAllBBox().width + 2*textBlockPaddingX;
    })
    .attr("height", function () {
      return findPlayAllBBox().height + 2*textBlockPaddingY;
    })
    .attr("class", "bBox")
    .attr("fill", "#fce5d3")
    .attr("stroke", "orange");


var delay = 0;

function playAll() {
  setTimeout(function () {
    if (animationCounter < insertLog.length) {
      numClicked(animationCounter);

      delay = 2000;
      if (stateHash2[animationCounter]) {
        delay += 1000;
      }
      if (stateSplit[animationCounter]) {
        delay += 2000;
      }
      animationCounter++;
      playAll();
    } else { // reaches end
      animationCounter = 1;
      delay = 0;
      playAllClicked = false;
    }
  }, delay);
}
