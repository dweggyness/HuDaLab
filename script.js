const bucketSize = 4;

class Bucket {
  constructor(localDepth = 1) {
    this.data = {};
    this.localDepth = localDepth;
  }

  isFull() {
    if (Object.keys(this.data).length > bucketSize){
      return true;
    }
    return false;
  }

  insert(key, value) {
    this.data[key] = value;
  }

  clear() {
    this.data = {};
  }
}

class ExtendibleHashingTable {
  constructor() {
    this.globalDepth = 1;
    this.directories = [new Bucket(), new Bucket()];
  }

  /* Hashes {data} based on {selectedHashFunction} and returns the hashed result
  @param {int} data - The input to be hashed
  @param {int} selectedHashFunction - Used to select the hash function to use.
  1 (Default) - Binary Hash
  @returns {string} Hashed data.
  */
  hash(data, selectedHashFunction = 1) {
    let hashedData;
    if (selectedHashFunction === 1) {
      hashedData = data.toString(2);
    }
    return hashedData;
  }

  getIndex(data) {
    const hashedData = this.hash(data)
    /* function to get the index/bucket that this data belongs to.

    1 << this.globalDepth == 3 -> 1000
    (1000) - 1 -> 0111
    hashedData = (...10101010101)
    hashedData & 0111 = (101)
    (101) -> 5 -> this.directories[5]
    */
    return hashedData & ((1 << this.globalDepth) - 1)
  }

  /* Increases the globalDepth/ directory size by 1, and for each new index just have it point to an existing bucket
  // e.g [0,1] -> [00 (points to '0'), 01 (points to '1'), 10 (points to '0'), 11 (points to '1')]
  */
  growDirectories() {
    // bitwise shift, so if this.globalDepth == 2, then i = 4 (binary: 100), GD = 3, then i = 8 (binary: 1000), etc
    for ( var i = 1 << this.globalDepth; i < 1 << this.globalDepth + 1; i++) {
      this.directories[i] = this.directories[i - (1 << this.globalDepth)];
    }
    this.globalDepth++;
  }

  /* Splits bucket with ID {key} into two buckets
  @param {int} key - bucket id
  */
  splitBucket(key) {
    const bucket = this.directories[key];

    // make a copy of the data in the bucket
    const tempData = JSON.parse(JSON.stringify(bucket.data));
    // clear the bucket
    this.directories[key].clear();

    // create 2 temporary buckets
    const tempBucket1 = new Bucket(bucket.localDepth + 1);
    const tempBucket2 = new Bucket(bucket.localDepth + 1);

    // calculate the most significant bit as that determines which bucket an elem in the old bucket will be split
    // into
    // e.g : old bucket is '10', localDepth = 2, then the 2 new buckets is either '010' or '110'
    // for each elem in old bucket, we just check it against this bit to determine which new bucket it goes into
    // in this case, bit is '100', we can do a bitwise & comparison to check against it
    const bit = 1 << bucket.localDepth;

    // rehash and check which new bucket each element in the old bucket belong sto
    for (var [key, val] of Object.entries(tempData)) {
      const hashedKey = this.hash(key);
      if (hashedKey & bit) {
        tempBucket1.insert(val, val);
      } else {
        tempBucket2.insert(val, val);
      }
    }

    // update this.directories with the 2 new buckets,
    // explanation of each argument:
    // start: calculate the location of first bucket
    // [0, 1, 0, 1, 0, 1, 0, 1], globalDepth 3 ( elements inside the array denote the bucket they are pointing to )
    // currently, index 0,2,4,6 all points towards the same bucket, localDepth 1
    // bucket '10', is index 2 and its full, so we increment localDepth to 2
    // so directories should look like [0, 2, 0, 1, 0, 2, 0, 1]
    //

    // stop: stop at max size of the directory array
    // step: if first bucket is '010', then second bucket is simply '110', so basically add '100' to bucket 1
    for (var i = this.hash(key) & bit - 1; i < (1 << this.globalDepth); i += bit) {
      this.directories[i] = (i & bit) ? tempBucket1 : tempBucket2;
    }
  }

  /* Inserts {data}, hashing it before inserting into the Extendible Hashing Table
  @param {int} data - The input to be inserted
  */
  insertIntoTable(data) {
    const key = this.getIndex(data);

    const bucket = this.directories[key];
    this.directories[key].insert(data, data);

    if (bucket.isFull()) {
      if (bucket.localDepth == this.globalDepth) {
        this.growDirectories();
      }

      this.splitBucket(key);
    }
  }
}

// data, initiate a new EHashing Table
const EHT = new ExtendibleHashingTable();

const NUM_ELEMS_TO_INSERT = 8;
// insert (1 to NUM_ELEMS_TO_INSERT) into the table in a random order
let arrayOfNums = [];
for (var i = 0; i < NUM_ELEMS_TO_INSERT; i++) {
  arrayOfNums[i] = i + 1;
}
for (var i = 0; i< NUM_ELEMS_TO_INSERT; i++ ) {
  const val = arrayOfNums[Math.floor(Math.random() * arrayOfNums.length)];
  arrayOfNums = arrayOfNums.filter(function(elem) { return elem !== val })
  EHT.insertIntoTable(val);
}




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

var svg = d3.select("#container-1")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "canvas")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


function getBucketLocation(d) {
  console.log(d);
  let x = 200 + d["order"] * 25;
  let y = 100 + d["bucket"] * 25;
  return "translate(" + x + ", " + y + ")"
}
function getKeyLocation(d, i) {
  let y = 100 + i * 25;
  return "translate(" + 10 + ", " + y + ")"
}
function getKeyIniLocation(d, i) {
  let y = 100 + i * 25;
  return "translate(" + -50 + ", " + y + ")"
}


function getUniqueBuckets(d) {
  // use an array uniqueBuckets to recrod the unique Buckets
  // bucketIdices maps the HT keys to the corresponding uniqueBuckets
  // remove duplicate in filter()
  var currIdx = 0;
  let uniqueBuckets = Array(d.length);
  let bucketIdices = Array(d.length);

  for (var i = 0; i < d.length; i++) {
    var foundIdx = -1;
    for (var j = 0; j < uniqueBuckets.length; j++) {
      if (uniqueBuckets[j] == d[i]) {
        foundIdx = j;
      }
    }
    if (foundIdx != -1) {
      bucketIdices[i]= foundIdx;
    } else {
      bucketIdices[i] = currIdx;
      uniqueBuckets[currIdx] = d[i];
      currIdx++;
    }
  }
  var temp = [];
  for(let i of uniqueBuckets){
    i && temp.push(i); // copy each non-empty value to the 'temp' array
  }
  uniqueBuckets = temp;
  return [uniqueBuckets, bucketIdices]
}

function flatOutBuckets(uniqueBuckets) {
  let flatted = [];
  for (var i = 0; i < uniqueBuckets.length; i++) {
    var currentBucket = Object.entries(uniqueBuckets[i].data);
    for (var j = 0; j < currentBucket.length; j++) {
      newEntry = {
        "key": currentBucket[j][0],
        "value": currentBucket[j][1],
        "bucket": i,
        "order": j,
      };
      flatted.push(newEntry);
    }
  }
  return flatted
}


function assignValueKey(d, i) {
  return "value" + d[0];
}
function assignBucketKey(d, i) {
  key = EHT.hash(Object.entries(d.data)[0][0]) & ((1 << d.localDepth) - 1);
  return key
}


// General Texts

// Global Depth
let globalDepth = svg.append("text")
  .attr("id", "globalDepth")
  .text("Global Depth: " + EHT.globalDepth)
  .attr("x", 25)
  .attr("y", 70)
  .attr("fill", "#000000");

let keyPart = svg.append("g").attr("class", "keyPart");
let arrowPart = svg.append("g").attr("class", "arrowPart");
let bucketPart = svg.append("g").attr("class", "bucketPart");

function drawViz() {


  var bucketData = EHT.directories;
  console.log(bucketData);

  // hash keys
  let keyGroup = keyPart
      .selectAll(".keyGroup")
        .data(bucketData, function(d,i) {
          return "key" + i;
        });

  // entering data (keys)
  let keys = keyGroup.enter()
    .append('g')
      .attr("class", "keyGroup");


  keys
      .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", "#ffffff");

  keys
      .append("text")
        .text(function(d,i) {
          return i.toString(2).padStart(EHT.globalDepth, "0");
        })
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#000000");

  keys.attr("transform", getKeyIniLocation).transition().attr("transform", getKeyLocation);

  let exitingKeys = keyGroup.exit();
  exitingKeys.remove();

  keys.transition().duration(500).attr("transform", getKeyLocation);

  // buckets & values
  console.log(bucketData);
  result = getUniqueBuckets(bucketData);
  uniqueBuckets = result[0];
  bucketIdices = result[1];

  console.log(uniqueBuckets);
  console.log("bucketIdices",bucketIdices);

  flattedData = flatOutBuckets(uniqueBuckets);

  console.log(flattedData);
  let valueGroup = bucketPart
      .selectAll(".valueGroup")
      .data(flattedData, function(d,i){
        return "value" + d['key']
      });

  let values = valueGroup.enter()
    .append('g')
      .attr('class', "valueGroup");

  values
    .append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .attr("fill", "#ffffff");

  values
      .append("text")
        .text(d => d["key"])
        .attr('class', "valueTexts")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#000000");

  values.transition().attr("transform", getBucketLocation);

  // update
  valueGroup.transition().attr("transform", getBucketLocation);

  // arrows connecting hash keys and bucket
  let arrowGroup = arrowPart.selectAll(".arrowGroup").data(bucketIdices, function(d,i) {
    return "arrow"+i
  });
  let arrows = arrowGroup.enter()
    .append("line")
      .attr("class", "arrowGroup")
        .attr("x1", 50)
        .attr("y1", function(d, i) {
          return 100 + i * 25
        })
        .attr("y2",function(d,i){
          return 100 + d * 25;
        })
        .attr("x2", 150)
        .attr("stroke", "#000000");


  let exitingArrows = arrowGroup.exit();
  exitingArrows.remove();

  arrowGroup.transition().duration(500).attr("y2",function(d,i){
    return 100 + d * 25;
  });








  globalDepth.text("Global Depth: " + EHT.globalDepth);
}

drawViz();

// Interactive Features
var newValue = null;
// user input
var userInput = document.createElement("INPUT");
userInput.setAttribute("type", "number");
userInput.setAttribute("placeholder", "Please input a positive integer.");
document.getElementById("container-1").appendChild(userInput);
userInput.setAttribute("id", "userInput");
userInput.setAttribute("style", "width:250px");
var submitButton = document.createElement("BUTTON");
submitButton.setAttribute("type", "button");
submitButton.setAttribute("onclick", "inputText()")
submitButton.innerHTML = "Submit";
document.getElementById("container-1").appendChild(submitButton);
submitButton.setAttribute("id", "submitButton");

function inputText() {
  newValue = parseFloat(userInput.value);
  userInput.value = '';
  if (newValue < 0 || newValue % 1 !== 0){
    alert("Please enter a valid number! \n A valid number is a Positve Integer.")
    newValue = null;
  } else {
    EHT.insertIntoTable(newValue);
    drawViz();

  }

}
