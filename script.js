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

var svg = d3.select("#container-1")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "canvas")
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add container for BUTTONS
var btnDiv = document.createElement("div");
btnDiv.setAttribute("id", "button-container");
document.getElementById("container-1").appendChild(btnDiv);

// add container for process log
let processLog = svg
    .append("g")
      .attr("id", "process-container")
      .attr("transform", "translate(500, 100)");

// declare bucket & EHT class
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

  /* Cleans EHT, restore this.directories
  */
  clean() {
    this.globalDepth = 1;
    this.directories = [new Bucket(), new Bucket()];
  }
}

// Interactive Features 1 ===============================================
// data, user initiate a new EHashing Table
const EHT = new ExtendibleHashingTable();

var newIniNum = null;
// create a seperate div for each interactive part
let userNumDiv = document.createElement("div");
userNumDiv.setAttribute("class", "btndiv");
userNumDiv.setAttribute("id", "divIniNum");
document.getElementById("button-container").appendChild(userNumDiv);

let userNum = document.createElement("INPUT");
userNum.setAttribute("type", "number");
userNum.setAttribute("placeholder", "Please input a positive integer.");
document.getElementById("divIniNum").appendChild(userNum);
userNum.setAttribute("id", "userNum");
userNum.setAttribute("style", "width:200px");
let submitNumBtn = document.createElement("BUTTON");
submitNumBtn.setAttribute("type", "button");
submitNumBtn.setAttribute("onclick", "iniEHT()")
submitNumBtn.innerHTML = "Submit";
document.getElementById("divIniNum").appendChild(submitNumBtn);
submitNumBtn.setAttribute("id", "submitNumBtn");
var numText = document.createElement("p");
numText.setAttribute("class", "btnText");
numText.innerHTML = "# of keys to insert:";
document.getElementById("divIniNum").appendChild(numText);
document.getElementById("divIniNum").appendChild(userNum);
document.getElementById("divIniNum").appendChild(submitNumBtn);

function iniEHT() {
  newIniNum = parseFloat(userNum.value);
  userNum.value = '';
  if (newIniNum < 0 || newIniNum % 1 !== 0){
    alert("Please enter a valid number! \n A valid number is a Positve Integer.")
    newIniNum = null;
  } else {
    EHT.clean();
    // if input number is valid, initialize a new EHT
    const NUM_ELEMS_TO_INSERT = newIniNum;
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
    drawViz();
  }
}


function getBucketLocation(d) {
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


// processlog helper functions
let insertLog = [];
function findInput() {
  let idx = insertLog.length - 1;
  console.log(idx);
  return "translate(" + 50 + "," + idx*25 + ")";
}
function findHash() {
  let idx = insertLog.length - 1;
  return "translate(" + 80 + "," + idx*25 + ")";
}
function findHashed() {
  let idx = insertLog.length - 1;
  return "translate(" + 0 + "," + idx*25 + ")";
}
function findLocate() {
  let idx = insertLog.length - 1;
  return "translate(" + 120 + "," + idx*25 + ")";
}
function findInsert() {
  let idx = insertLog.length - 1;
  return "translate(" + 170 + "," + idx*25 + ")";
}
// General Texts
// Local Depth
let localDepth = svg.append("text")
  .attr("id", "localDepth")
  .text("Local Depth")
  .attr("x", 300)
  .attr("y", 70)
  .attr("fill", "#000000");

// Global Depth
let globalDepth = svg.append("text")
  .attr("id", "globalDepth")
  .text("Global Depth: ")
  .attr("x", 25)
  .attr("y", 70)
  .attr("fill", "#000000");

let globalDepthDigit = svg.append("text")
  .attr("id", "globalDepthDigit")
  .text(EHT.globalDepth)
  .attr("x", 125)
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
        .attr("class", "keyText")
        .attr("id", function(d,i) {
          return "key" + i;
        })
        .text(function(d,i) {
          return i.toString(2).padStart(EHT.globalDepth, "0")
        })
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#000000");

  keys.attr("transform", getKeyIniLocation).transition().attr("transform", getKeyLocation);

  let exitingKeys = keyGroup.exit();
  exitingKeys.remove();

  keys.transition().duration(500).attr("transform", getKeyLocation);
  // because keytext is not directly bounded to data,
  // we use brute force to change the text
  svg.selectAll(".keyText").text(function(d,i) {
    return i.toString(2).padStart(EHT.globalDepth, "0")
  });

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

  //exitingValues
  let exitingValues = valueGroup.exit();
  exitingValues.remove();

  // update
  valueGroup.transition().attr("transform", getBucketLocation);

  // arrows connecting hash keys and bucket
  let arrowGroup = arrowPart.selectAll(".arrowGroup").data(bucketIdices, function(d,i) {
    return "arrow"+i
  });
  let arrows = arrowGroup.enter()
    .append("line")
      .attr("class", "arrowGroup")
      .attr("id", function(d, i) {
        return "arrow" + d
      })
        .transition()
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

  // local depth digit
  let localDepthGroup = bucketPart.selectAll(".localGroup").data(uniqueBuckets);
  let localDepthDigits = localDepthGroup.enter()
    .append("text")
      .text(d => d.localDepth)
        .attr("class", "localGroup")
        .attr("transform", function (d, i) {
          return "translate(350, " + (100 + i * 25) + ")"
        });

  let exitingLocalDepth = localDepthGroup.exit();
  exitingLocalDepth.remove();

  localDepthGroup.transition()
    .text(d => d.localDepth)
      .attr("transform", function (d, i) {
        return "translate(350, " + (100 + i * 25) + ")"
      });

  // update globalDepthDigit accordingly
  globalDepthDigit.text(EHT.globalDepth);
}

// drawViz();

// Interactive Features 2 ========================================
// user insert new values
var newInsert = null;

// create a seperate div for each interactive part
let userInsertDiv = document.createElement("div");
userInsertDiv.setAttribute("class", "btndiv");
userInsertDiv.setAttribute("id", "divInsert");
document.getElementById("button-container").appendChild(userInsertDiv);

var userInsert = document.createElement("INPUT");
userInsert.setAttribute("type", "number");
userInsert.setAttribute("placeholder", "Please insert a positive integer.");
userInsert.setAttribute("id", "userInsert");
userInsert.setAttribute("style", "width:200px");
var submitInsertBtn = document.createElement("BUTTON");
submitInsertBtn.setAttribute("type", "button");
submitInsertBtn.setAttribute("onclick", "insertValue()")
submitInsertBtn.innerHTML = "Submit";
submitInsertBtn.setAttribute("id", "submitInsertBtn");
var insertText = document.createElement("p");
insertText.setAttribute("class", "btnText");
insertText.innerHTML = "Add another key: ";
document.getElementById("divInsert").appendChild(insertText);
document.getElementById("divInsert").appendChild(userInsert);
document.getElementById("divInsert").appendChild(submitInsertBtn);

var hashedKey = null;
var convKey = null;

function insertValue() {
  newInsert = parseFloat(userInsert.value);
  userInsert.value = '';
  if (newInsert < 0 || newInsert % 1 !== 0){
    alert("Please enter a valid number! \n A valid number is a Positve Integer.")
    newInsert = null;
  } else {
    // EHT.insertIntoTable(newInsert);
    hashedKey = EHT.hash(newInsert);
    insertLog.push(newInsert);
    console.log(insertLog);
    showHash(hashedKey);


    convKey = hashedKey & ((1 << EHT.globalDepth) - 1)
    let bucket = EHT.directories[convKey];
    EHT.directories[convKey].insert(newInsert, newInsert);

    showLocate(convKey);

    if (bucket.isFull()) {
      if (bucket.localDepth == EHT.globalDepth) {
        EHT.growDirectories();
      }

      EHT.splitBucket(convKey);
    }

    showInsert();

  }

}


function showHash(key) {
  processLog
    .append("text")
      .text(newInsert)
      .attr("transform", findInput)
      ;

  processLog
    .append("text")
      .text("hash")
      .attr("transform", findHash)
      .attr("class", "textBtn")
      .on("click", hashClicked)
      ;
}
function hashClicked() {
  console.log("hash clicked");
  processLog.append("text")
    .text(hashedKey)
    .attr("transform", findHashed)
    .attr("text-anchor", "end")
    .attr("id", function () { return "hash_" + newInsert });
  // emphasis
  processLog.append("text")
    .text(function () { return hashedKey.slice(-EHT.globalDepth) })
    .attr("transform", findHashed)
    .attr("fill", "#000")
    .transition().duration(500)
    .attr("text-anchor", "end")
    .attr("fill", "#f00")
    .attr("id", function () { return "hash_" + newInsert });

  globalDepth.transition().duration(500).attr("fill", "#ff0");
  globalDepthDigit.transition().duration(500).attr("fill", "#f00");
}

function showLocate() {
  processLog
    .append("text")
      .text("locate")
      .attr("transform", findLocate)
      .attr("class", "textBtn")
      .on("click", locateClicked);
}
function locateClicked() {
  console.log("locate clicked");

  // emphasis
  svg.select("#key"+convKey).transition().duration(500).attr("fill", "#f00");

  //animated line
  let arrow = svg.select("#arrow"+convKey);
  arrow.each(function() {
    let tempArrow = svg
      .append("line")
        .attr("class", "arrowAnimated")
        .attr("x1", this.x1.baseVal.value)
        .attr("y1", this.y1.baseVal.value)
        .attr("x2", this.x2.baseVal.value)
        .attr("y2", this.y2.baseVal.value);
  })
}

function showInsert() {
  processLog
    .append("text")
      .text("insert")
      .attr("transform", findInsert)
      .attr("class", "textBtn")
      .on("click", insertClicked);
}
function insertClicked() {
  drawViz();
}
