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
  x += 200 + d["order"] * 30;
  y += 100 + d["bucket"] * 25;
  return "translate(" + x + ", " + y + ")"

}




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
document.getElementById("container-1").appendChild(btnDiv);


var svg = d3.select("#container-1")
    .append("svg")
      .attr("width", 900 + 'px')
      .attr("height", 600 + 'px')
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
      .attr("transform", "translate(350, 0)");

let keyPart = vizSection.append("g").attr("class", "keyPart");
// let arrowPart = vizSection.append("g").attr("class", "arrowPart");
let bucketPart = vizSection.append("g").attr("class", "bucketPart");


const LHT = new LinearHashingTable();

const NUM_ELEMS_TO_INSERT = 40;
// insert (10 to NUM_ELEMS_TO_INSERT + 10) into the table in a random order
let arrayOfNums = [];
const startingNum = 10;
for (var i = startingNum; i < NUM_ELEMS_TO_INSERT + startingNum; i++) {
  arrayOfNums[i - startingNum] = i + 1;
}
for (var i = startingNum; i< NUM_ELEMS_TO_INSERT + startingNum; i++ ) {
  const val = arrayOfNums[Math.floor(Math.random() * arrayOfNums.length)];
  arrayOfNums = arrayOfNums.filter(function(elem) { return elem !== val })

  LHT.insertIntoTable(val);
}



function drawViz(lht) {

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

  keys.attr("transform", getKeyIniLocation).transition().attr("transform", getKeyLocation);

  let exitingKeys = keyGroup.exit();
  exitingKeys.remove();

  // update
  keyGroup.transition().duration(500).attr("transform", getKeyLocation);

  // buckets & values
  let flattedData = flatOutBuckets(bucketData);
  console.log(flattedData);

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

  values.transition().attr("transform", getBucketLocation);

  //exitingValues
  let exitingValues = valueGroup.exit();
  exitingValues.remove();

  // update
  valueGroup.transition().attr("transform", getBucketLocation);

}


drawViz(LHT);
