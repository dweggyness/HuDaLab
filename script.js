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

// add container for process log
let processLog = svg
    .append("g")
      .attr("id", "process-container")
      .attr("transform", "translate(0, 70)");

// add container for find key
let findSection = svg
    .append("g")
      .attr("id", "find-container")
      .attr("transform", "translate(0, 20)");

// add container for spliting (rehashing)
let splitSection = svg
    .append("g")
      .attr("id", "split-container")
      .attr("transform", "translate(725, 100)");





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

  /* Cleans EHT, reset this.directories, i.e. reinitialize EHT
  */
  clean() {
    this.globalDepth = 1;
    this.directories = [new Bucket(), new Bucket()];
  }

  /* takes a new EHT as param, deepcopy from original EHT to a new EHT object.
  one thing important is that simply creating new buckets and assigning the same parameters of the buckets from the original EHT are not ideal, because we have the entries in the directories pointing to same buckets.
  for the visualization previously implemented to work, the original structure must be maintained.
  */
  deepcopyto(tempEHT) {
    let uniqueOri = [];
    let uniqueNew = [];
    let tempDirectories = Array(this.directories.length);
    for (var i = 0; i < this.directories.length; i++) {
      var foundDup = -1;
      let bucket = this.directories[i];
      for (var j = 0; j < uniqueOri.length; j++) {
        if (bucket == uniqueOri[j]) {
          foundDup = j;
        }
      }
      if (foundDup != -1) { // found duplicate buckets
        let tempBucket = uniqueNew[foundDup];
        tempDirectories[i] = tempBucket;
      } else { // not found
        let tempBucket = new Bucket();
        tempBucket.localDepth = bucket.localDepth;
        tempBucket.data = JSON.parse(JSON.stringify(bucket.data));
        uniqueOri.push(bucket);
        uniqueNew.push(tempBucket);
        tempDirectories[i] = tempBucket;
      }
    }
    tempEHT.globalDepth = this.globalDepth;
    tempEHT.directories = tempDirectories;
  }
}

// Interactive Features 1 ===============================================
// data, user initiate a new EHashing Table
const EHT = new ExtendibleHashingTable();

let initialEHT = new ExtendibleHashingTable();
EHT.deepcopyto(initialEHT);
// keep track of EHT after every insertion;
let ehtRecord = [initialEHT];

let flattedData;

// states to record whether each button has been clicked.
let stateHash = [];
let stateLocate = [];
let stateFullInsert = [];
let stateExpand = [];
// let stateSplit = [];
let stateInsert = [];
var insertIdx = 0;
let insertLog = [null];

var fullAnimate = false;
var animationLock = true;

var newIniNum = null;
// create a seperate div for each interactive part
let userNumDiv = document.createElement("div");
userNumDiv.setAttribute("class", "btndiv");
userNumDiv.setAttribute("id", "divIniNum");
document.getElementById("button-container").appendChild(userNumDiv);

let userNum = document.createElement("INPUT");
userNum.setAttribute("type", "number");
userNum.setAttribute("placeholder", "Positive integer");
document.getElementById("divIniNum").appendChild(userNum);
userNum.setAttribute("id", "userNum");
userNum.setAttribute("style", "width:150px");
userNum.addEventListener("keypress", (e) => {
  if (e.key == "Enter") {
    e.preventDefault();
    iniEHT();
  }
});
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

    // change canvas size
    desHeight =  600 + Math.max(0, newIniNum-18)*28 + "px";
    document.getElementById("canvas").setAttribute("height", desHeight);

    animationLock = false;
    ehtRecord = [initialEHT];
    // states to record whether each button has been clicked.
    stateHash = [false];
    stateLocate = [false];
    stateFullInsert = [false];
    stateExpand = [false];
    // stateSplit = [false];
    stateInsert = [false];
    insertIdx = 0;
    insertLog = [null];
    d3.select("#process-container").selectAll("*").remove();
    d3.selectAll(".finding").remove();
    d3.selectAll(".findingStatic").remove();

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

      // EHT.insertIntoTable(val);

      //update states
      insertIdx++;
      stateHash.push(true);
      stateLocate.push(true);
      stateInsert.push(true);

      hashedKey = EHT.hash(val);

      convKey = hashedKey & ((1 << EHT.globalDepth) - 1)
      let bucket = EHT.directories[convKey];
      EHT.directories[convKey].insert(val, val);

      insertLog.push({
        "ins": val,
        "key": hashedKey,
        "convkey": convKey
      })

      showHash(insertIdx);
      showLocate(insertIdx);

      if (bucket.isFull()) {
        if (bucket.localDepth == EHT.globalDepth) {
          EHT.growDirectories();
        }

        EHT.splitBucket(convKey);
        showFullInsert(insertIdx);
        showExpand(insertIdx);
        showSplit(insertIdx);
        stateFullInsert.push(true);
        stateExpand.push(true);
      } else {
        stateFullInsert.push(null);
        stateExpand.push(null);
        showInsert(insertIdx);
      }

      // update EHT record
      tempEHT = new ExtendibleHashingTable();
      EHT.deepcopyto(tempEHT);
      ehtRecord.push(tempEHT);

    }
    drawViz(EHT);
  }
}


function getBucketLocation(d) {
  let x = 200 + d["order"] * 30;
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


function findGDBBox() {
  return d3.select("#globalDepthDigit").node().getBBox();
}

function findKeyBBox(d,i) {
  return d3.select("#key"+i).node().getBBox();
}
function findFullBBox() {
  return d3.select("#fullText").node().getBBox();
}
function findLDBBox(d,i) {
  return d3.select("#ld"+i).node().getBBox();
}
function findFindHashBBox() {
  return d3.select("#hashfindBtn").node().getBBox();
}
function findFindHashedBBox() {
  return d3.select("#hashedfind").node().getBBox();
}

function findHashBBox(idx) {
  return d3.select("#hashBtn" + idx).node().getBBox();
}
function findHash_BBox(idx) {
  return d3.select("#hash_"+insertLog[idx]["ins"]).node().getBBox();
}
function findLocateBBox(idx) {
  return d3.select("#locateBtn" + idx).node().getBBox();
}
function findFullInsertBBox(idx) {
  return d3.select("#fullInsertBtn" + idx).node().getBBox();
}
function findExpandBBox(idx) {
  return d3.select("#expandBtn" + idx).node().getBBox();
}
function findSplitBBox(idx) {
  return d3.select("#splitBtn" + idx).node().getBBox();
}
function findSplitHashBBox(j) {
  return d3.select("#splitHash" + j).node().getBBox();
}
function findInsertBBox(idx) {
  return d3.select("#insertBtn" + idx).node().getBBox();
}

function findPlayAllBBox() {
  return d3.select("#playAllBtn").node().getBBox();
}


// change states
function stateHashChange(idx, state) {
  stateHash[idx] = state;
  // update btn color
  if (state) {
    d3.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
    d3.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
    // change current key color
    d3.select("#hashed"+idx).attr("class", "textBtn clickedText");
    d3.select("#hashedBBox"+idx).attr("class", "bBox clickedBBox");
  } else {
    d3.select("#hashBtn"+idx).attr("class", "textBtn unclickedText");
    d3.select("#hashBtnBBox"+idx).attr("class", "bBox unclickedBBox");
    // change current key color
    d3.select("#hashed"+idx).attr("class", "textBtn unclickedText");
    d3.select("#hashedBBox"+idx).attr("class", "bBox unclickedBBox");
  }
}
function stateLocateChange(idx, state) {
  stateLocate[idx] = state;
  // update btn color
  if (state) {
    d3.select("#locateBtn"+idx).attr("class", "textBtn clickedText");
    d3.select("#locateBtnBBox"+idx).attr("class", "bBox clickedBBox");
  } else {
    d3.select("#locateBtn"+idx).attr("class", "textBtn unclickedText");
    d3.select("#locateBtnBBox"+idx).attr("class", "bBox unclickedBBox");
  }
}
function stateFullInsertChange(idx, state) {
  stateFullInsert[idx] = state;
  // update btn color
  if (state) {
    d3.select("#fullInsertBtn"+idx).attr("class", "textBtn clickedText");
    d3.select("#fullInsertBtnBBox"+idx).attr("class", "bBox clickedBBox");
  } else {
    d3.select("#fullInsertBtn"+idx).attr("class", "textBtn unclickedText");
    d3.select("#fullInsertBtnBBox"+idx).attr("class", "bBox unclickedBBox");
  }
}
function stateExpandChange(idx, state) {
  stateExpand[idx] = state;
  // update btn color
  if (state) {
    d3.select("#expandBtn"+idx).attr("class", "textBtn clickedText");
    d3.select("#expandBtnBBox"+idx).attr("class", "bBox clickedBBox");
  } else {
    d3.select("#expandBtn"+idx).attr("class", "textBtn unclickedText");
    d3.select("#expandBtnBBox"+idx).attr("class", "bBox unclickedBBox");
  }
}
function stateInsertChange(idx, state) {
  stateInsert[idx] = state;
  split = (stateExpand[idx] === null) ? false:true;
  // update btn color
  if (split) {
    if (state) {
      d3.select("#splitBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#splitBtnBBox"+idx).attr("class", "bBox clickedBBox");
    } else {
      d3.select("#splitBtn"+idx).attr("class", "textBtn unclickedText");
      d3.select("#splitBtnBBox"+idx).attr("class", "bBox unclickedBBox");
    }
  } else {
    if (state) {
      d3.select("#insertBtn"+idx).attr("class", "textBtn clickedText");
      d3.select("#insertBtnBBox"+idx).attr("class", "bBox clickedBBox");
    } else {
      d3.select("#insertBtn"+idx).attr("class", "textBtn unclickedText");
      d3.select("#insertBtnBBox"+idx).attr("class", "bBox unclickedBBox");
    }
  }

}


function getUniqueBuckets(d) {
  // use an array uniqueBuckets to recrod the unique Buckets
  // bucketIndices maps the HT keys to the corresponding uniqueBuckets
  // remove duplicate in filter()
  var currIdx = 0;
  let uniqueBuckets = Array(d.length);
  let bucketIndices = Array(d.length);

  for (var i = 0; i < d.length; i++) {
    var foundIdx = -1;
    for (var j = 0; j < uniqueBuckets.length; j++) {
      if (uniqueBuckets[j] == d[i]) {
        foundIdx = j;
      }
    }
    if (foundIdx != -1) {
      bucketIndices[i]= foundIdx;
    } else {
      bucketIndices[i] = currIdx;
      uniqueBuckets[currIdx] = d[i];
      currIdx++;
    }
  }
  var temp = [];
  for(let i of uniqueBuckets){
    i && temp.push(i); // copy each non-empty value to the 'temp' array
  }
  uniqueBuckets = temp;
  return [uniqueBuckets, bucketIndices]
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
function findLogBtnY(idx) {
  idx = idx - 1;
  return idx*28
}


function findFull(idx) {
  let arrow = svg.select("#arrow"+insertLog[idx]["convkey"]);
  arrow.each(function() {
    y = this.getAttribute("d").split(",").pop() - 95;
  })
  return [-25, y];
}



// General Texts
// Local Depth
let localDepth = svg.append("text")
  .attr("id", "localDepth")
  .text("Local Depth")
  .attr("x", 640)
  .attr("y", 70)
  .attr("fill", "#000000");

// Global Depth
let globalDepth = svg.append("text")
  .attr("id", "globalDepth")
  .text("Global Depth: ")
  .attr("x", 360)
  .attr("y", 70)
  .attr("fill", "#000000");

let globalDepthDigit = svg.append("text")
  .attr("id", "globalDepthDigit")
  .text(EHT.globalDepth)
  .attr("x", 470)
  .attr("y", 70)
  .attr("fill", "#000000");

let globalDepthDigitBBox = svg.insert("rect", "#globalDepthDigit")
  .attr("x", function () {
    return findGDBBox().x - textBlockPaddingX;
  })
  .attr("y", function () {
    return findGDBBox().y - textBlockPaddingY;
  })
  .attr("width", function () {
    return findGDBBox().width + 2*textBlockPaddingX;
  })
  .attr("height", function () {
    return findGDBBox().height + 2*textBlockPaddingY;
  })
  .attr("class", "bBox")
  .attr("fill", "#e0faec")
  .attr("stroke", "#3fbc77");


let keyPart = vizSection.append("g").attr("class", "keyPart");
let arrowPart = vizSection.append("g").attr("class", "arrowPart");
let bucketPart = vizSection.append("g").attr("class", "bucketPart");

function drawViz(eht) {

  drawValues(eht);
  drawKeyArrow(eht);

  // remove
  d3.selectAll(".spliting").remove();
  d3.selectAll(".arrowAnimated").remove();
}
function drawKeyArrow(eht) {

  var bucketData = eht.directories;
  // console.log(bucketData);

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
      .append("text")
        .attr("class", "keyText")
        .attr("id", function(d,i) {
          return "key" + i;
        })
        .text(function(d,i) {
          return i.toString(2).padStart(eht.globalDepth, "0")
        })
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "#000000");

  keys
      .insert('rect','text')
        .attr("class", "keyBBox bBox")
        .attr("x", function (d,i) {
          return findKeyBBox(d,i).x-textBlockPaddingX;
        })
        .attr("y", function (d,i) {
          return findKeyBBox(d,i).y-textBlockPaddingY;
        })
        .attr("width", function (d,i) {
          return findKeyBBox(d,i).width+2*textBlockPaddingX;
        })
        .attr("height", function (d,i) {
          return findKeyBBox(d,i).height+2*textBlockPaddingY;
        })
        .attr("stroke", "rebeccapurple")
        .attr("fill", "#f1ebff");


  keys.attr("transform", getKeyIniLocation).transition().attr("transform", getKeyLocation);

  let exitingKeys = keyGroup.exit();
  exitingKeys.remove();

  keys.transition().duration(500).attr("transform", getKeyLocation);
  // because keytext is not directly bounded to data,
  // we use brute force to change the text
  svg.selectAll(".keyText").text(function(d,i) {
    return i.toString(2).padStart(eht.globalDepth, "0")
  });
  svg.selectAll(".keyBBox")
    .attr("x", function (d,i) {
      return findKeyBBox(d,i).x-textBlockPaddingX;
    })
    .attr("y", function (d,i) {
      return findKeyBBox(d,i).y-textBlockPaddingY;
    })
    .attr("width", function (d,i) {
      return findKeyBBox(d,i).width+2*textBlockPaddingX;
    })
    .attr("height", function (d,i) {
      return findKeyBBox(d,i).height+2*textBlockPaddingY;
    });

  // buckets & values
  result = getUniqueBuckets(bucketData);
  uniqueBuckets = result[0];
  bucketIndices = result[1];

  flattedData = flatOutBuckets(uniqueBuckets);

  // arrows connecting hash keys and bucket
  let arrowGroup = arrowPart.selectAll(".arrowGroup").data(bucketIndices, function(d,i) {
    return "arrow"+i
  });

  let link = d3.linkHorizontal()
      .source(function (d,i) {
        return [50, 95+i*25]
      })
      .target(function (d,i) {
        return [165, 95+d*25]
      });

  let arrows = arrowGroup.enter()
    .append("path")
      .attr("class", "arrowGroup")
      .attr("id", function(d, i) {
        return "arrow" + i
      })
        .transition()
      .attr("d", link)
      .attr("stroke", "#000000");


  let exitingArrows = arrowGroup.exit();
  exitingArrows.remove();

  arrowGroup.transition().duration(500).attr("d", link);

  // local depth digit
  let localDepthGroup1 = bucketPart.selectAll(".localGroup1").data(uniqueBuckets);
  let localDepthGroup2 = bucketPart.selectAll(".localGroup2").data(uniqueBuckets);

  localDepthGroup1.enter()
    .append("text")
      .text(d => d.localDepth)
        .attr("class", "localGroup1")
        .attr("id", function (d, i) {
          return "ld" + i;
        })
        .attr("x", 325)
        .attr("y", function (d, i) {
          return 100 + i * 25
        });

  localDepthGroup2.enter()
    .insert("rect", ".localGroup1")
      .attr("class", "localGroup2 bBox")
      .attr("x", function (d,i) {
        return findLDBBox(d,i).x - textBlockPaddingX;
      })
      .attr("y", function (d,i) {
        return findLDBBox(d,i).y - textBlockPaddingY;
      })
      .attr("width", function (d,i) {
        return findLDBBox(d,i).width + 2*textBlockPaddingX;
      })
      .attr("height", function (d,i) {
        return findLDBBox(d,i).height + 2*textBlockPaddingY;
      })
      .attr("fill", "#e0faec")
      .attr("stroke", "#3fbc77");

  let exitingLocalDepth1 = localDepthGroup1.exit();
  exitingLocalDepth1.remove();
  let exitingLocalDepth2 = localDepthGroup2.exit();
  exitingLocalDepth2.remove();

  localDepthGroup1.transition()
    .text(d => d.localDepth)
      .attr("y", function (d, i) {
        return 100 + i * 25
      });

  // update globalDepthDigit accordingly
  globalDepthDigit.text(eht.globalDepth);
}
function drawValues(eht) {
  var bucketData = eht.directories;
  // console.log(bucketData);

  // buckets & values
  result = getUniqueBuckets(bucketData);
  uniqueBuckets = result[0];
  bucketIndices = result[1];

  flattedData = flatOutBuckets(uniqueBuckets);

  // console.log(flattedData);
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
    .attr("stroke", "#3f66bc")
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



function insertValue() {
  var hashedKey = null;
  var convKey = null;
  var dup = false;
  newInsert = parseFloat(userInsert.value);
  userInsert.value = '';
  for (var i = 1; i < insertLog.length; i++) {
    if (newInsert == insertLog[i]['ins']) {
      dup = true;
    }
  }
  if (newInsert < 0 || newInsert % 1 !== 0 || dup){
    alert("Please enter a valid number! \n A valid number is a Positve Integer that is not in the Extendible Hashing Table")
    newInsert = null;
  } else {
    // EHT.insertIntoTable(newInsert);
    animationLock = false;

    //update states
    insertIdx++;

    // change canvas size
    desHeight =  600 + Math.max(0, insertIdx-18)*28 + "px";
    document.getElementById("canvas").setAttribute("height", desHeight);

    stateHash.push(true);
    stateLocate.push(true);
    stateInsert.push(true);

    hashedKey = EHT.hash(newInsert);

    convKey = hashedKey & ((1 << EHT.globalDepth) - 1)
    let bucket = EHT.directories[convKey];
    EHT.directories[convKey].insert(newInsert, newInsert);

    insertLog.push({
      "ins": newInsert,
      "key": hashedKey,
      "convkey": convKey
    })

    showHash(insertIdx);
    showLocate(insertIdx);

    if (bucket.isFull()) {
      if (bucket.localDepth == EHT.globalDepth) {
        EHT.growDirectories();
      }

      EHT.splitBucket(convKey);
      showFullInsert(insertIdx);
      showExpand(insertIdx);
      showSplit(insertIdx);
      stateFullInsert.push(true);
      stateExpand.push(true);
    } else {
      stateFullInsert.push(null);
      stateExpand.push(null);
      showInsert(insertIdx);
    }



    // update EHT record
    tempEHT = new ExtendibleHashingTable();
    EHT.deepcopyto(tempEHT);
    ehtRecord.push(tempEHT);
  }

}

// animation delay thread, keeps adding.
// the animation function call is recursive,
// from the current implementation (as we first call recursion then add delay), delay adds from end to begining,
// and the actuall delay at the begining is the smallest
// so we create a queue, to keep track of the delay;
var delay = 0;
var delayStack = [];

function showHash(idx) {
  processLog
    .append("text")
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "hashed"+idx;
      })
      .text(insertLog[idx]["ins"])
      .attr("text-anchor", "middle")
      .attr("x", 250)
      .attr("y", function() {
        return findLogBtnY(idx);
      })
      .on("click", function () {
        delay = 0;
        stateHashChange(idx, false);
        stateLocateChange(idx, false);
        if (stateFullInsert[idx] !== null) {
          stateFullInsertChange(idx, false);
          stateExpandChange(idx, false);
        }
        stateInsertChange(idx, false);
        insertClicked(idx);
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "hashedBBox"+idx
      })
      .attr("x", 235)
      .attr("y", function () {
        return findLogBtnY(idx)-15.5;
      })
      .attr("width", 30)
      .attr("height", 20);

  processLog
    .append("text")
      .text("hash")
      .attr("x", 5)
      .attr("y", function () {
        return findLogBtnY(idx);
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "hashBtn" + idx
      })
      .on("click", function () {
        delay = 0;
        hashClicked(idx);
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
  // console.log("hash clicked");
  if (fullAnimate) {
    if (idx>1 && !stateInsert[idx-1]) {
      if (stateExpand[idx-1] === null) {
        insertClicked(idx-1);
        delay+=1000;
        delayStack.push(delay);
      } else {
        splitClicked(idx-1);
        delay+=1000;
        delayStack.push(delay);
      }

    }
  } else {
    delayStack.push(300);
  }

  // if the first insert
  if (idx == 1) {
    drawViz(ehtRecord[0]);
  }

  setTimeout(function () {
    // if (!stateHash[idx]) {
      //remove other hashed keys
      processLog.selectAll(".hashed").remove();

      processLog.append("text")
        .text(insertLog[idx]["key"])
        .attr("x", function () {
          return 300
        })
        .attr("y", function () {
          return findLogBtnY(idx);
        })
        .attr("text-anchor", "end")
        .attr("id", function () { return "hash_" + insertLog[idx]["ins"] })
        .attr("class", "hashed")
        .attr("x", function () {
          return 275 + findHash_BBox(idx).width
        });

      processLog
        .insert("rect", "text")
          .attr("class", "bBox hashed")
          .attr("id", function () {
            return "hash_BBox"+idx
          })
          .attr("x", function () {
            return findHash_BBox(idx).x - textBlockPaddingX;
          })
          .attr("y", function () {
            return findHash_BBox(idx).y - textBlockPaddingY;
          })
          .attr("width", function () {
            return findHash_BBox(idx).width + 2*textBlockPaddingX;
          })
          .attr("height", function () {
            return findHash_BBox(idx).height + 2*textBlockPaddingY;
          })
          .attr("fill", "#e0faec")
          .attr("stroke", "#3fbc77");

      // emphasis
      processLog.append("text")
        .text(function () { return insertLog[idx]["key"].slice(-ehtRecord[idx-1].globalDepth) })
        .attr("x", 300)
        .attr("y", function () {
          return findLogBtnY(idx);
        })
        .attr("fill", "#000")
        .attr("text-anchor", "end")
        .attr("x", function () {
          return 275 + findHash_BBox(idx).width
        })
        .attr("id", function () { return "hash_emph_" + insertLog[idx]["ins"] })
        .attr("class", "hashed")
        .transition().duration(500)
          .attr("fill", "#f00");


    // }
    // reset fill color of existing key emphasis
    svg.selectAll(".keyText").attr("fill", "#000");
    //remove existing animated line
    svg.selectAll(".arrowAnimated").remove();
    //revert to previous eht
    drawViz(ehtRecord[idx-1]);

    svg.select("#hash_emph_" + insertLog[idx]["ins"]).attr("fill", "#000")
      .transition().duration(500).attr("fill", "#f00");
    // globalDepth.attr("fill", "#000")
    //   .transition().duration(500).attr("fill", "#ff0");
    globalDepthDigit.attr("fill", "#000")
      .transition().duration(500).attr("fill", "#f00");




    // set current hash clicked state to true
    stateHashChange(idx, true);
    // set all previous clicked state to true;
    for (var i = 1; i < idx; i++) {
      stateHashChange(i, true);
      stateLocateChange(i, true);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, true);
        stateExpandChange(i, true);
      }
      stateInsertChange(i, true);
    }
    // set all later clicked state to false;
    stateLocateChange(idx, false);
    if (stateFullInsert[idx] !== null) {
      stateFullInsertChange(idx, false);
      stateExpandChange(idx, false);
    }
    stateInsertChange(idx, false);
    for (var i = idx+1; i < stateHash.length; i++) {
      stateHashChange(i, false);
      stateLocateChange(i, false);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, false);
        stateExpandChange(i, false);
      }
      stateInsertChange(i, false);
    }
  }, delayStack.shift());

}


function showLocate(idx) {
  processLog
    .append("text")
      .text("locate")
      .attr("x", 46)
      .attr("y", function () {
        return findLogBtnY(idx);
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "locateBtn" + idx
      })
      .on("click", function () {
        delay = 0;
        locateClicked(idx);
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "locateBtnBBox"+idx
      })
      .attr("x", function () {
        return findLocateBBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findLocateBBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findLocateBBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findLocateBBox(idx).height + 2*btnPaddingY;
      });
}
function locateClicked(idx) {
  // console.log("locate clicked");
  // if stateHash is false, i.e. hashBtn is not clicked, then we will first run hashClicked, then run locateClicked with a delay.

  if (!stateHash[idx]) {
    hashClicked(idx);
    delay+=800;
    delayStack.push(delay);
  }

  setTimeout(function () {
    // reset fill color of existing key emphasis
    svg.selectAll(".keyText").attr("fill", "#000");

    //remove existing animated line
    svg.selectAll(".arrowAnimated").remove();

    //revert to previous eht
    drawViz(ehtRecord[idx-1]);

    // emphasis
    svg.select("#key"+insertLog[idx]["convkey"]).attr("fill", "#000")
      .transition().duration(500).attr("fill", "#f00");
    //animated line
    let arrow = svg.select("#arrow"+insertLog[idx]["convkey"]);
    arrow.each(function() {
      let tempArrow = arrowPart
        .append("path")
          .attr("class", "arrowAnimated")
          // .attr("transform", "translate(350, 0)")
          .attr("d", this.getAttribute('d'));
    })


    // set current hash clicked state to true
    stateLocateChange(idx, true);
    // set all later clicked state to false;
    if (stateFullInsert[idx] !== null) {
      stateFullInsertChange(idx, false);
      stateExpandChange(idx, false);
    }
    stateInsertChange(idx, false);
    for (var i = idx+1; i < stateHash.length; i++) {
      stateHashChange(i, false);
      stateLocateChange(i, false);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, false);
        stateExpandChange(i, false);
      }
      stateInsertChange(i, false);
    }
  }, delayStack.shift());
}

function showFullInsert(idx) {
  processLog
    .append("text")
      .text("insert")
      .attr("x", 95)
      .attr("y", function () {
        return findLogBtnY(idx);
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "fullInsertBtn" + idx
      })
      .on("click", function () {
        delay = 0;
        fullInsertClicked(idx);
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "fullInsertBtnBBox"+idx
      })
      .attr("x", function () {
        return findFullInsertBBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findFullInsertBBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findFullInsertBBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findFullInsertBBox(idx).height + 2*btnPaddingY;
      });

}
function fullInsertClicked(idx) {
  if (!stateLocate[idx]) {
    locateClicked(idx);
    delay+=1000;
    delayStack.push(delay);
  }

  setTimeout(function () {
    drawViz(ehtRecord[idx-1]);
    // show Full if current bucket is Full
    splitSection.append("text")
      .text("FULL")
        .attr("id", "fullText")
        .attr("x", function () {
          return findFull(idx)[0]
        })
        .attr("y", function () {
          return findFull(idx)[1]
        })
        .transition()
          .attr("fill", "#f00")
          .attr("class", "spliting");

    splitSection.insert("rect", "text")
      .attr("class", "spliting bBox")
        .attr("x", function () {
          return findFullBBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findFullBBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findFullBBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findFullBBox().height + 2*textBlockPaddingY;
        })
        .transition()
          .attr("fill", "#e0faec")
          .attr("stroke", "#3fbc77");

    // draw the entering new value but with temp location
    var bucketData = ehtRecord[idx].directories;
    // console.log(bucketData);

    // buckets & values
    result = getUniqueBuckets(bucketData);
    uniqueBuckets = result[0];
    bucketIndices = result[1];

    flattedData = flatOutBuckets(uniqueBuckets);

    // console.log(flattedData);
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
      .attr("stroke", "#3f66bc")
      .attr("fill", "#e0e9fa");

    values.transition()
      .attr("transform", function () {
        y = 100+findFull(idx)[1]
        return "translate(" + 170 + "," + y + ")"
      });

    // set current fullinsert clicked state to true
    stateFullInsertChange(idx, true);
    // set all later clicked state to false;
    stateExpandChange(idx, false);
    stateInsertChange(idx, false);
    for (var i = idx+1; i < stateHash.length; i++) {
      stateHashChange(i, false);
      stateLocateChange(i, false);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, false);
        stateExpandChange(i, false);
      }
      stateInsertChange(i, false);
    }

  }, delayStack.shift());
}
function showExpand(idx) {
  processLog
    .append("text")
      .text("expand")
      .attr("x", 140.5)
      .attr("y", function () {
        return findLogBtnY(idx);
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "expandBtn" + idx
      })
      .on("click", function () {
        delay = 0;
        expandClicked(idx);
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "expandBtnBBox"+idx
      })
      .attr("x", function () {
        return findExpandBBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findExpandBBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findExpandBBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findExpandBBox(idx).height + 2*btnPaddingY;
      });
}
function expandClicked(idx) {
  if (!stateFullInsert[idx]) {
    fullInsertClicked(idx);
    delay+=1000;
    delayStack.push(delay);
  }

  setTimeout(function () {
    // update local depth, arrow, key and global depth
    drawKeyArrow(ehtRecord[idx]);

    // list this bucket to split
    let arrow = svg.select("#arrow"+insertLog[idx]["convkey"]);
    arrow.each(function() {
      y = (this.getAttribute("d").split(",").pop() - 95) / 25 ;
    })

    let splitedBucket = Object.keys(ehtRecord[idx-1].directories[y].data);
    // append the newly inserted key
    splitedBucket.push(insertLog[idx]["ins"].toString());
    // get this bucket's local Depth
    let ld = ehtRecord[idx-1].directories[y].localDepth;
    const bit = 1 << ld;

    // set up two temporary buckets
    let gp1 = [];
    let gp2 = [];
    for (var i = 0; i < splitedBucket.length; i++) {
      const hashedKey = parseInt(splitedBucket[i]).toString(2);
      if (hashedKey & bit) {
        gp1.push(splitedBucket[i]);
      } else {
        gp2.push(splitedBucket[i]);
      }
    }
    var gp1Counter = 0;
    var gp2Counter = 0;
    var gp1BBoxCounter = 0;
    var gp2BBoxCounter = 0;
    var gp1HashCounter = 0;
    var gp2HashCounter = 0;

    for (var i = 0; i < splitedBucket.length; i++) {
      // reset parent node translation
      let v = d3.select("#value" + splitedBucket[i]);
      let g = v.select(function() { return this.parentNode; });
      g.attr("transform", "");

      d3.select("#value" + splitedBucket[i]).transition()
        .attr("transform, none")
        .attr("x", function () {
          return 430;
        })
        .attr("y", function () {
          if (gp1.includes(splitedBucket[i])) {
            loc = gp1Counter;
            gp1Counter++;
          } else {
            loc = gp2Counter + 4.5;
            gp2Counter++;
          }
          return 100+loc*25;
        });

      d3.select("#valueBBox" + splitedBucket[i]).transition()
        .attr("x", function () {
          return 430-15;
        })
        .attr("y", function () {
          if (gp1.includes(splitedBucket[i])) {
            loc = gp1BBoxCounter;
            gp1BBoxCounter++;
          } else {
            loc = gp2BBoxCounter + 4.5;
            gp2BBoxCounter++;
          }
          return 100+loc*25-15;
        });

      splitSection.append("text")
        .text(parseInt(splitedBucket[i]).toString(2))
        .attr("class", "spliting")
        .attr("id", function () {
          return "splitHash" + i
        })
        // .transition()
          .attr("x", 85)
          .attr("y", function () {
            if (gp1.includes(splitedBucket[i])) {
              loc = gp1HashCounter;
              gp1HashCounter++;
            } else {
              loc = gp2HashCounter + 4.5;
              gp2HashCounter++;
            }
            return loc*25;
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

    // set current expand clicked state to true
    stateExpandChange(idx, true);
    // set all later clicked state to false;
    stateInsertChange(idx, false);
    for (var i = idx+1; i < stateHash.length; i++) {
      stateHashChange(i, false);
      stateLocateChange(i, false);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, false);
        stateExpandChange(i, false);
      }
      stateInsertChange(i, false);
    }


  }, delayStack.shift());
}
function showSplit(idx) {
  processLog
    .append("text")
      .text("split")
      .attr("x", 199)
      .attr("y", function () {
        return findLogBtnY(idx);
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "splitBtn" + idx
      })
      .on("click", function () {
        delay = 0;
        splitClicked(idx);
      });

  processLog
    .insert("rect", "text")
      .attr("class", "bBox clickedBBox")
      .attr("id", function () {
        return "splitBtnBBox"+idx
      })
      .attr("x", function () {
        return findSplitBBox(idx).x - btnPaddingX;
      })
      .attr("y", function () {
        return findSplitBBox(idx).y - btnPaddingY;
      })
      .attr("width", function () {
        return findSplitBBox(idx).width + 2*btnPaddingX;
      })
      .attr("height", function () {
        return findSplitBBox(idx).height + 2*btnPaddingY;
      });
}
function splitClicked(idx) {

  if (!stateExpand[idx]) {
    expandClicked(idx);
    delay+=1000;
    delayStack.push(delay);
  }
  setTimeout(function () {
    drawViz(ehtRecord[idx]);
    // set current split(insert) clicked state to true
    stateInsertChange(idx, true);
    for (var i = idx+1; i < stateHash.length; i++) {
      stateHashChange(i, false);
      stateLocateChange(i, false);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, false);
        stateExpandChange(i, false);
      }
      stateInsertChange(i, false);
    }
  }, delayStack.shift());

}


function showInsert(idx) {
  processLog
    .append("text")
      .text("insert")
      .attr("x", 95)
      .attr("y", function() {
        return findLogBtnY(idx);
      })
      .attr("class", "textBtn clickedText")
      .attr("id", function () {
        return "insertBtn"+idx
      })
      .on("click", function () {
        delay = 0;
        insertClicked(idx);
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
  if (stateExpand[idx] === null) {
    if (!stateLocate[idx]) {
      locateClicked(idx);
      delay+=1000;
      delayStack.push(delay);
    }
  } else {
    if (!stateExpand[idx]) {
      expandClicked(idx);
      delay+=1000;
      delayStack.push(delay);
    }
  }

  setTimeout(function () {

    drawViz(ehtRecord[idx]);

    // set current insert clicked state to true
    stateInsertChange(idx, true);
    // set all later clicked state to false;
    for (var i = idx+1; i < stateHash.length; i++) {
      stateHashChange(i, false);
      stateLocateChange(i, false);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, false);
        stateExpandChange(i, false);
      }
      stateInsertChange(i, false);
    }
  }, delayStack.shift());

}


// Interactive Features 3 ===============================================
// find key
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
var submitFindBtn = document.createElement("BUTTON");
submitFindBtn.setAttribute("type", "button");
submitFindBtn.setAttribute("onclick", "findValue()")
submitFindBtn.innerHTML = "Submit";
submitFindBtn.setAttribute("id", "submitFindBtn");
var findText = document.createElement("p");
findText.setAttribute("class", "btnText");
findText.innerHTML = "Find a key: ";
document.getElementById("divFind").appendChild(findText);
document.getElementById("divFind").appendChild(userFind);
document.getElementById("divFind").appendChild(submitFindBtn);


function findValue() {
  if (stateInsert.slice(1, stateInsert.length).includes(false)) {
    alert("Please finish all the inserts in order to find.")
  } else {
    let find = parseFloat(userFind.value);

    // clear the input field.
    userFind.value = '';
    var found = false;
    for (var i = 1; i < insertLog.length; i++) {
      if (find == insertLog[i]['ins']) {
        found = true;
      }
    }

    if (find < 0 || find % 1 !== 0 || !found){
      alert("Please enter a valid number! \n A valid number is a Positve Integer that is IN the extendible hashing table.")
      find = null;
    } else {
      d3.selectAll(".findingStatic").remove();
      //remove animated line;
      d3.selectAll(".arrowAnimated").remove();
      // remove hashed keys
      d3.selectAll(".finding").remove();

      findSection
        .append("text")
          .attr("class", "findingStatic unclickedText")
          .attr("id", "findNum")
          .text(find)
          .attr("text-anchor", "middle")
          .attr("x", 250)
          .attr("y", 10);

      findSection
        .insert("rect", "text")
          .attr("class", "findingStatic bBox unclickedBBox")
          .attr("id", "findNumBBox")
          .attr("x", 235)
          .attr("y", -5.5)
          .attr("width", 30)
          .attr("height", 20);

      findSection
        .append("text")
          .attr("class", "findingStatic textBtn unclickedText")
          .attr("id", "hashfindBtn")
          .text("hash&find")
          .attr("x", 150)
          .attr("y", 10)
          .on("click", function () {
            findClicked(find);
          });

      findSection
        .insert("rect", ".findingStatic")
          .attr("class", "findingStatic bBox unclickedBBox")
          .attr("id", "hashfindBtnBBox")
          .attr("x", function () {
            return findFindHashBBox().x - btnPaddingX;
          })
          .attr("y", function () {
            return findFindHashBBox().y - btnPaddingY;
          })
          .attr("width", function () {
            return findFindHashBBox().width + 2*btnPaddingX;
          })
          .attr("height", function () {
            return findFindHashBBox().height + 2*btnPaddingY;
          });
    }
  }
}

function findClicked(find) {
  let currentEHT = ehtRecord[insertIdx];
  let hashedKey = currentEHT.hash(find);
  let convKey = currentEHT.getIndex(find);

  //remove animated line;
  d3.selectAll(".arrowAnimated").remove();
  // remove hashed keys
  d3.selectAll(".finding").remove();
  //recover states
  d3.select("#value"+find).attr("fill", "#000");
  d3.select("#key" + convKey).attr("fill", "#000");
  d3.selectAll(".valueTexts").attr("fill", "#000");
  d3.selectAll(".keyText").attr("fill", "#000");

  // update btn color
  d3.select("#hashfindBtn").attr("class", "findingStatic textBtn clickedText");
  d3.select("#hashfindBtnBBox").attr("class", "findingStatic bBox clickedBBox");
  d3.select("#findNum").attr("class", "findingStatic textBtn clickedText");
  d3.select("#findNumBBox").attr("class", "findingStatic bBox clickedBBox");

  findSection
    .append("text")
      .attr("class", "finding")
      .attr("id", "hashedfind")
      .text(hashedKey)
      .attr("text-anchor", "end")
      .attr("x", 300)
      .attr("y", 10)
      .attr("x", function () {
        return 275 + findFindHashedBBox().width
      });

  findSection.insert("rect", "text")
    .attr("class", "finding bBox")
    .attr("x", function () {
      return findFindHashedBBox().x - textBlockPaddingX;
    })
    .attr("y", function () {
      return findFindHashedBBox().y - textBlockPaddingY;
    })
    .attr("width", function () {
      return findFindHashedBBox().width + 2*textBlockPaddingX;
    })
    .attr("height", function () {
      return findFindHashedBBox().height + 2*textBlockPaddingY;
    })
    .attr("fill", "#e0faec")
    .attr("stroke", "#3fbc77");

  // globalDepth.attr("fill", "#000")
  //   .transition().duration(500).attr("fill", "#ff0");
  globalDepthDigit.attr("fill", "#000")
    .transition().duration(500).attr("fill", "#f00");

  //animated line
  let arrow = svg.select("#arrow"+convKey);
  arrow.each(function() {
    let tempArrow = arrowPart
      .append("path")
        .transition().delay(500)
          .attr("d", this.getAttribute('d'))
          .attr("class", "arrowAnimated");
  })

  d3.select("#key" + convKey).transition().delay(500)
    .attr("fill", "#f00");

  findSection
    .append("text")
      .attr("class", "finding")
      .text(hashedKey.slice(-currentEHT.globalDepth))
      .attr("text-anchor", "end")
      .attr("x", 300)
      .attr("y", 10)
      .attr("x", function () {
        return 275 + findFindHashedBBox().width
      })
      .transition().delay(500)
        .attr("fill", "#f00");

  d3.select("#value"+find)
    .transition().delay(1000)
      .attr("fill", "#f00");

}


// Interactive Features 4 ===============================================
// play all
// add play all BUTTON
let playAllBtn = svg.append("text")
    .text("Play All")
    .attr("id", "playAllBtn")
    .attr("class", "textBtn")
    .attr("x", 10)
    .attr("y", 30)
    .on("click", playAll);

let playAllBtnBbox = svg.insert("rect", "text")
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

function playAll() {
  if (animationLock) {
    alert("Current Extendible Hashing Table is EMPTY!")
  } else {
    fullAnimate = true;
    // set all active state to false;
    for (var i = 1; i < stateHash.length; i++) {
      stateHashChange(i, false);
      stateLocateChange(i, false);
      if (stateFullInsert[i] !== null) {
        stateFullInsertChange(i, false);
        stateExpandChange(i, false);
      }
      stateInsertChange(i, false);
    }
    if (stateExpand.slice(-1)[0] === null) {
      insertClicked(stateHash.length-1);
    } else {
      splitClicked(stateHash.length-1);
    }
    fullAnimate = false;
  }

}
