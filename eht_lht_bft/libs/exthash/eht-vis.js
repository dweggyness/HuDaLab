function EHT_vis() {
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
      const hashedKey = this.hash(key);
      for (var i = hashedKey & bit - 1; i < (1 << this.globalDepth); i += bit) {
        if (i & bit) {
          this.directories[i] = tempBucket1;
        } else {
          this.directories[i] = tempBucket2;
        }
      }

      // check for edge case, where all the split keys go into the same new bucket
      const newBucketKey1 = hashedKey & bit - 1;
      const newBucketKey2 = (hashedKey & bit - 1) + bit;
      const newBucket1 = this.directories[newBucketKey1];
      const newBucket2 = this.directories[newBucketKey2];

      return [newBucketKey1, newBucket1, newBucketKey2, newBucket2]
    }

    splitAgain(newBucketKey1, newBucket1, newBucketKey2, newBucket2) {
      // check the sizes of the two new buckets that were split. if any of them are full, split again
      // this.display();
      if (newBucket1.isFull()) {
        if (newBucket1.localDepth == this.globalDepth) {
          this.growDirectories();
        }
        this.splitBucket(newBucketKey1);
        return true
      } else if (newBucket2.isFull()) {
        if (newBucket2.localDepth == this.globalDepth) {
          this.growDirectories();
        }
        this.splitBucket(newBucketKey2);
        return true
      } else {
        return false
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

        b = this.splitBucket(key);
        b1Key = b[0];
        b1 = b[1];
        b2Key = b[2];
        b2 = b[3];
        splitAgain = this.splitAgain(b1Key, b1, b2Key, b2);
      }
    }

    /* Cleans EHT, reset this.directories, i.e. reinitialize EHT
    */
    clean() {
      this.globalDepth = 1;
      this.directories = [new Bucket(), new Bucket()];
    }


    // helper function to display and debug and look around, feel free to remove after ur done
    // display() {
    //   console.log("Global depth:", this.globalDepth, " Bucket size:", bucketSize, "\n");
    //   for (var i = 0; i < (1 << this.globalDepth); i++) {
    //     console.log(this.hash(i).slice(-this.globalDepth).padStart(this.globalDepth, "0"), " - ", "Depth: " + this.directories[i].localDepth + " "
    //     , this.directories[i].data);
    //   }
    // }

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
  btnDiv.setAttribute("id", "eht-button-container");
  btnDiv.setAttribute("class", "button-container");
  document.getElementById("eht-container").appendChild(btnDiv);

  // var containerWidth = document.getElementById("eht-container").getAttribute("width");
  var svg = d3.select("#eht-container")
      .append("svg")
        // .attr("width", containerWidth + 'px')
        // .attr("height", 600 + 'px')
        .attr("viewBox", [0, 0, width, height])
        // .attr("preserveAspectRatio","none")
        // .attr("width", width + margin.left + margin.right)
        // .attr("height", height + margin.top + margin.bottom)
        .attr("id", "eht-canvas")
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




  // Interactive Features 1 ===============================================
  // data, user initiate a new EHashing Table
  const EHT = new ExtendibleHashingTable();

  let initialEHT = new ExtendibleHashingTable();
  EHT.deepcopyto(initialEHT);
  // keep track of EHT after every insertion;
  let ehtRecord = [initialEHT];
  var animationLock = false;

  let flattedData;

  // states to record whether each button has been clicked.
  let stateHash = [false];
  let stateExpand = [false];

  var insertIdx = 0;
  let insertLog = [null];

  var fullAnimate = false;

  var newIniNum = null;
  // create a seperate div for each interactive part
  let userNumDiv = document.createElement("div");
  userNumDiv.setAttribute("class", "btndiv");
  userNumDiv.setAttribute("id", "eht-divIniNum");
  document.getElementById("eht-button-container").appendChild(userNumDiv);

  let userNum = document.createElement("INPUT");
  userNum.setAttribute("type", "number");
  // userNum.setAttribute("placeholder", "Positive integer");
  userNum.value = '20';
  document.getElementById("eht-divIniNum").appendChild(userNum);
  userNum.setAttribute("id", "eht-userNum");
  userNum.addEventListener("keypress", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      iniEHT();
    }
  });
  var numText = document.createElement("p");
  numText.setAttribute("class", "buttonText");
  numText.innerHTML = "# of keys to insert:";
  document.getElementById("eht-divIniNum").appendChild(numText);
  document.getElementById("eht-divIniNum").appendChild(userNum);

  function iniEHT() {
    newIniNum = parseFloat(userNum.value);
    userNum.value = '';
    if (newIniNum < 0 || newIniNum % 1 !== 0){
      alert("Please enter a valid number! \n A valid number is a Positve Integer.")
      newIniNum = null;
    } else {
      EHT.clean();

      // change canvas size
      desHeight =  600 + Math.max(0, newIniNum-18)*28;
      desViewBox = "0 0 900 " + desHeight;
      document.getElementById("eht-canvas").setAttribute("viewBox", desViewBox);

      ehtRecord = [initialEHT];
      // states to record whether each button has been clicked.
      stateHash = [false];
      stateExpand = [false];
      animationLock = false;
      insertIdx = 0;
      insertLog = [null];

      svg.select("#process-container").selectAll("*").remove();
      svg.selectAll(".finding").remove();
      svg.selectAll(".findingStatic").remove();

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

          // EHT.splitBucket(convKey);
          b = EHT.splitBucket(convKey);

          showFullInsert(insertIdx);
          showExpand(insertIdx);
          showSplit(insertIdx);
          stateExpand.push(true);


          // update EHT record
          tempEHT = new ExtendibleHashingTable();
          EHT.deepcopyto(tempEHT);
          ehtRecord.push(tempEHT);

          convKey = hashedKey & ((1 << EHT.globalDepth) - 1);

          b1Key = b[0];
          b1 = b[1];
          b2Key = b[2];
          b2 = b[3];
          splitAgain = EHT.splitAgain(b1Key, b1, b2Key, b2);

          if (splitAgain) {
            insertIdx++;

            insertLog.push({
              "ins": val,
              "key": hashedKey,
              "convkey": convKey
            })

            showExpand(insertIdx);
            showSplit(insertIdx);
            stateHash.push(null);
            stateExpand.push(true);

            // potentially update EHT record
            tempEHT_splitagain = new ExtendibleHashingTable();
            EHT.deepcopyto(tempEHT_splitagain);
            ehtRecord.push(tempEHT_splitagain);
          }
        } else {
          // no expand
          stateExpand.push(null);
          showInsert(insertIdx);
          // update EHT record
          tempEHT = new ExtendibleHashingTable();
          EHT.deepcopyto(tempEHT);
          ehtRecord.push(tempEHT);
        }
        showHashed(insertIdx);


      }
      drawViz(EHT);
    }
  }

  function getBucketBGLocation(d, i) {
    let x = 200
    let y = 100 + i * 25;
    return "translate(" + x + ", " + y + ")"
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
    return svg.select("#globalDepthDigit").node().getBBox();
  }

  function findKeyBBox(d,i) {
    return svg.select("#key"+i).node().getBBox();
  }
  function findFullBBox() {
    return svg.select("#fullText").node().getBBox();
  }
  function findLDBBox(d,i) {
    return svg.select("#ld"+i).node().getBBox();
  }
  function findFindHashBBox() {
    return svg.select("#hashfindBtn").node().getBBox();
  }
  function findFindHashedBBox() {
    return svg.select("#hashedfind").node().getBBox();
  }

  function findHashBBox(idx) {
    return svg.select("#hashBtn" + idx).node().getBBox();
  }
  function findHash_BBox(idx) {
    return svg.select("#hash_"+insertLog[idx]["ins"]).node().getBBox();
  }
  function findLocateBBox(idx) {
    return svg.select("#locateBtn" + idx).node().getBBox();
  }
  function findFullInsertBBox(idx) {
    return svg.select("#insertBtn" + idx).node().getBBox();
  }
  function findExpandBBox(idx) {
    return svg.select("#expandBtn" + idx).node().getBBox();
  }
  function findSplitBBox(idx) {
    return svg.select("#splitBtn" + idx).node().getBBox();
  }
  function findSplitHashBBox(j) {
    return svg.select("#splitHash" + j).node().getBBox();
  }
  function findInsertBBox(idx) {
    return svg.select("#insertBtn" + idx).node().getBBox();
  }

  // update btn color helper function
  // i: insertIdx
  // state: true/false. true for clicked, false for unclicked.
  function changeThisStageBtn(i, state) {
    let refer = ["#hashBtn", "#locateBtn", "#insertBtn", "#expandBtn", "#splitBtn", "#hashed"];
    for (var j = 0; j < refer.length; j++) {
      if (state) {
        svg.select(refer[j]+i).attr("class", "textBtn clickedText");
        svg.select(refer[j]+"BBox"+i).attr("class", "bBox clickedBBox");
      } else {
        svg.select(refer[j]+i).attr("class", "textBtn unclickedText");
        svg.select(refer[j]+"BBox"+i).attr("class", "bBox unclickedBBox");
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
        svg.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
        break;
      case "locate":
        svg.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#locateBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#locateBtnBBox"+idx).attr("class", "bBox clickedBBox");
        break;
      case "insert":
        svg.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#locateBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#locateBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#insertBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#insertBtnBBox"+idx).attr("class", "bBox clickedBBox");
        break;
      case "expand":
        svg.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#locateBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#locateBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#insertBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#insertBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#expandBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#expandBtnBBox"+idx).attr("class", "bBox clickedBBox");
        break;
      case "split":
        svg.select("#hashBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#hashBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#locateBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#locateBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#insertBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#insertBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#expandBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#expandBtnBBox"+idx).attr("class", "bBox clickedBBox");
        svg.select("#splitBtn"+idx).attr("class", "textBtn clickedText");
        svg.select("#splitBtnBBox"+idx).attr("class", "bBox clickedBBox");
        break;
    }


    if (stateHash[idx+1] !== null) {
      // not second split
      svg.select("#hashed"+idx).attr("class", "textBtn clickedText");
      svg.select("#hashedBBox"+idx).attr("class", "bBox clickedBBox");
    } else {
      svg.select("#hashed"+(idx+1).toString()).attr("class", "textBtn clickedText");
      svg.select("#hashedBBox"+(idx+1).toString()).attr("class", "bBox clickedBBox");
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
    let eht = ehtRecord[idx-1];
    let bucket = eht.directories[insertLog[idx]["convkey"]];
    let ld = bucket.localDepth;
    let y = parseInt(insertLog[idx]["key"].slice(-ld), 2) * 25;
    return [0, y];
  }



  // General Texts
  // section indicator
  svg.append("text")
      .text("Log of insertion steps")
      .attr("x", 15)
      .attr("y", 5)
      .attr("class", "section-title")
      .attr("fill", "#000000");
  svg.append("text")
      .text("State of hash table")
      .attr("x", 500)
      .attr("y", 5)
      .attr("class", "section-title")
      .attr("fill", "#000000");
  // Local Depth
  let localDepth = svg.append("text")
    .attr("id", "localDepth")
    .text("Local Depth")
    .attr("x", 660)
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

  let bucketBGPart = vizSection.append("g").attr("class", "bucketBGPart");
  let keyPart = vizSection.append("g").attr("class", "keyPart");
  let arrowPart = vizSection.append("g").attr("class", "arrowPart");
  let bucketPart = vizSection.append("g").attr("class", "bucketPart");

  function drawViz(eht) {

    drawValues(eht);
    drawKeyArrow(eht);

    // remove
    svg.selectAll(".spliting").remove();
    svg.selectAll(".arrowAnimated").remove();
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

    keys.transition().attr("transform", getKeyLocation);
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
    var bucketData = eht.directories;
    // console.log(bucketData);

    //empty buckets background
    let bucketBGGroup = bucketBGPart
        .selectAll(".bucketBGGroup")
        .data(uniqueBuckets, function (d, i) {
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

    arrowGroup.transition().attr("d", link);

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
          .attr("x", 350)
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

    //empty buckets background
    let bucketBGGroup = bucketBGPart
        .selectAll(".bucketBGGroup")
        .data(uniqueBuckets, function (d, i) {
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
    svg.selectAll(".valueTexts").transition().attr("x", 0).attr("y",0);
    svg.selectAll(".valueBBox").transition().attr("x", -15).attr("y", -15.5)
    valueGroup.transition().attr("transform", getBucketLocation);
  }

  // drawViz();

  // call iniEHT before user input, so we have something before user interaction.
  iniEHT();
  userNum.value = "20";

  // Interactive Features 2 ========================================
  // user insert new values
  var newInsert = null;


  // create a seperate div for each interactive part
  let userInsertDiv = document.createElement("div");
  userInsertDiv.setAttribute("class", "btndiv");
  userInsertDiv.setAttribute("id", "eht-divInsert");
  document.getElementById("eht-button-container").appendChild(userInsertDiv);

  var userInsert = document.createElement("INPUT");
  userInsert.setAttribute("type", "number");
  // userInsert.setAttribute("placeholder", "Positive integer");
  userInsert.setAttribute("id", "eht-userInsert");
  // upon pressing enter
  userInsert.addEventListener("keypress", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      insertValue();
    }
  });
  var insertText = document.createElement("p");
  insertText.setAttribute("class", "buttonText");
  insertText.innerHTML = "Add a key: ";
  document.getElementById("eht-divInsert").appendChild(insertText);
  document.getElementById("eht-divInsert").appendChild(userInsert);



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

      //update states
      insertIdx++;

      // change canvas size
      desHeight =  600 + Math.max(0, insertIdx-18)*28;
      desViewBox = "0 0 900 " + desHeight;
      document.getElementById("eht-canvas").setAttribute("viewBox", desViewBox);

      stateHash.push(true);

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

        // EHT.splitBucket(convKey);
        b = EHT.splitBucket(convKey);

        showFullInsert(insertIdx);
        showExpand(insertIdx);
        showSplit(insertIdx);
        stateExpand.push(true);


        // update EHT record
        tempEHT = new ExtendibleHashingTable();
        EHT.deepcopyto(tempEHT);
        ehtRecord.push(tempEHT);

        convKey = hashedKey & ((1 << EHT.globalDepth) - 1);

        b1Key = b[0];
        b1 = b[1];
        b2Key = b[2];
        b2 = b[3];
        splitAgain = EHT.splitAgain(b1Key, b1, b2Key, b2);

        if (splitAgain) {
          insertIdx++;

          insertLog.push({
            "ins": newInsert,
            "key": hashedKey,
            "convkey": convKey
          })

          showExpand(insertIdx);
          showSplit(insertIdx);
          stateHash.push(null);
          stateExpand.push(true);


          tempEHT_splitagain = new ExtendibleHashingTable();
          EHT.deepcopyto(tempEHT_splitagain);
          ehtRecord.push(tempEHT_splitagain);
        }
      } else {
        stateExpand.push(null);
        showInsert(insertIdx);
        // update EHT record
        tempEHT = new ExtendibleHashingTable();
        EHT.deepcopyto(tempEHT);
        ehtRecord.push(tempEHT);
      }

      showHashed(insertIdx);

    }
    drawViz(EHT);

  }


  function showHashed(idx) {
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
          if (!animationLock) {
            drawViz(ehtRecord[idx-1]);
            hashedClicked(idx);
          }
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
  }
  function hashedClicked(idx) {
    animationLock = true;
    // draw previous step
    drawViz(ehtRecord[idx-1]);
    hashClicked(idx);
    if (stateHash[idx] === null) {
      // split twice
      hashClicked(idx-1);
      setTimeout(function () {
        locateClicked(idx-1);
        setTimeout(function () {
          fullInsertClicked(idx-1);
          setTimeout(function () {
            expandClicked(idx-1);
            setTimeout(function () {
              splitClicked(idx-1);
              setTimeout(function () {
                expandClicked(idx);
                setTimeout(function () {
                  splitClicked(idx);
                  setTimeout(function () {
                    animationLock = false;
                  }, 1000);
                }, 1000);
              }, 1000);
            }, 1000);
          }, 1000);
        }, 500);
      }, 500);
    } else {
      // split once or no splt
      hashClicked(idx);
      setTimeout(function () {
        locateClicked(idx);
        setTimeout(function () {
          if (stateExpand[idx] === null) {
            // no split
            insertClicked(idx);
            setTimeout(function () {
              animationLock = false;
            }, 1000);
          } else {
            // split once
            fullInsertClicked(idx);
            setTimeout(function () {
              expandClicked(idx);
              setTimeout(function () {
                splitClicked(idx);
                setTimeout(function () {
                  animationLock = false;
                }, 1000);
              }, 1000);
            }, 1000);
          }
        }, 500);
      }, 500);
    }
  }
  function showHash(idx) {
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
          if (!animationLock) {
            // draw previous step
            drawViz(ehtRecord[idx-1]);
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
    // console.log("hash clicked");
    // if (!stateHash[idx]) {
      //remove other hashed keys
    processLog.selectAll(".hashed").remove();

    processLog.append("text")
      .text(insertLog[idx]["key"])
      .attr("x", function () {
        return 300
      })
      .attr("y", function () {
        if (stateHash[idx+1] === null) {
          return findLogBtnY(idx+1);
        } else {
          return findLogBtnY(idx);
        }
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
        if (stateHash[idx+1] === null) {
          return findLogBtnY(idx+1);
        } else {
          return findLogBtnY(idx);
        }
      })
      .attr("fill", "#000")
      .attr("text-anchor", "end")
      .attr("x", function () {
        return 275 + findHash_BBox(idx).width
      })
      .attr("id", function () { return "hash_emph_" + insertLog[idx]["ins"] })
      .attr("class", "hashed")
      .transition()
        .attr("fill", "#f00");


    // }
    // reset fill color of existing key emphasis
    svg.selectAll(".keyText").attr("fill", "#000");
    //remove existing animated line
    svg.selectAll(".arrowAnimated").remove();


    svg.select("#hash_emph_" + insertLog[idx]["ins"]).attr("fill", "#000")
      .transition().attr("fill", "#f00");
    // globalDepth.attr("fill", "#000")
    //   .transition().duration(500).attr("fill", "#ff0");
    globalDepthDigit.attr("fill", "#000")
      .transition().attr("fill", "#f00");

    // change Btn color
    changeBtnColor(idx, "hash");
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
          if (!animationLock) {
            // draw previous viz
            drawViz(ehtRecord[idx-1]);
            locateClicked(idx);
          }
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
    hashClicked(idx);
    // reset fill color of existing key emphasis
    svg.selectAll(".keyText").attr("fill", "#000");

    //remove existing animated line
    svg.selectAll(".arrowAnimated").remove();


    // emphasis
    svg.select("#key"+insertLog[idx]["convkey"]).attr("fill", "#000")
      .transition().attr("fill", "#f00");
    //animated line
    let arrow = svg.select("#arrow"+insertLog[idx]["convkey"]);
    arrow.each(function() {
      let tempArrow = arrowPart
        .append("path")
          .attr("class", "arrowAnimated")
          // .attr("transform", "translate(350, 0)")
          .attr("d", this.getAttribute('d'));
    })

    // change btn color
    changeBtnColor(idx, "locate");
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
          return "insertBtn" + idx
        })
        .on("click", function () {
          if (!animationLock) {
            // draw previous viz
            drawViz(ehtRecord[idx-1]);
            fullInsertClicked(idx);
          }
        });

    processLog
      .insert("rect", "text")
        .attr("class", "bBox clickedBBox")
        .attr("id", function () {
          return "insertBtnBBox"+idx
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
    hashClicked(idx);
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
          .attr("stroke", "#3fbc77")
          .attr("class", "spliting bBox");

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

    // change btn color
    changeBtnColor(idx, "insert");
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
          if (!animationLock) {
            // draw previous state
            drawViz(ehtRecord[idx-1]);
            fullInsertClicked(idx);
            expandClicked(idx);
          }
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
    hashClicked(idx);

    // update local depth, arrow, key and global depth
    drawKeyArrow(ehtRecord[idx]);

    svg.selectAll(".spliting").remove();

    // list this bucket to split
    let y = insertLog[idx]['convkey'];

    let splitedBucket = Object.keys(ehtRecord[idx-1].directories[y].data);

    //not second split?
    if (stateHash[idx] !== null && stateExpand[idx] !== null) {
      // append the newly inserted key
      splitedBucket.push(insertLog[idx]["ins"].toString());
    }

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
      let v = svg.select("#value" + splitedBucket[i]);
      let g = v.select(function() { return this.parentNode; });
      g.transition().attr("transform", "");

      svg.select("#value" + splitedBucket[i]).transition()
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

      svg.select("#valueBBox" + splitedBucket[i]).transition()
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


    // change btn color
    changeBtnColor(idx, "expand");

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
          if (!animationLock) {
            // draw previous viz
            drawViz(ehtRecord[idx-1]);
            splitClicked(idx);
          }
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
    hashClicked(idx);
    if (stateHash[idx+1] === null) {
      // show Full if current bucket is Full
      splitSection.append("text")
        .text("FULL")
          .attr("id", "fullText")
          .attr("x", function () {
            return findFull(idx+1)[0]
          })
          .attr("y", function () {
            return findFull(idx+1)[1]
          })
          .transition()
            .attr("fill", "#f00")
            .attr("class", "spliting");

      splitSection.insert("rect", "text")
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
            .attr("stroke", "#3fbc77")
            .attr("class", "spliting bBox");
    }
    drawViz(ehtRecord[idx]);

    // change btn color
    changeBtnColor(idx, "split");
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
          if (!animationLock) {
            // draw previous viz
            drawViz(ehtRecord[idx-1]);
            insertClicked(idx);
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
    hashClicked(idx);
    drawViz(ehtRecord[idx]);

    // change btn color
    changeBtnColor(idx, "insert");

  }


  // Interactive Features 3 ===============================================
  // find key
  // create a seperate div for each interactive part
  let userFindDiv = document.createElement("div");
  userFindDiv.setAttribute("class", "btndiv");
  userFindDiv.setAttribute("id", "eht-divFind");
  document.getElementById("eht-button-container").appendChild(userFindDiv);

  var userFind = document.createElement("INPUT");
  userFind.setAttribute("type", "number");
  // userFind.setAttribute("placeholder", "Positive integer");
  userFind.setAttribute("id", "eht-userInsert");
  userFind.addEventListener("keypress", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      findValue();
    }
  });
  var findText = document.createElement("p");
  findText.setAttribute("class", "buttonText");
  findText.innerHTML = "Find a key: ";
  document.getElementById("eht-divFind").appendChild(findText);
  document.getElementById("eht-divFind").appendChild(userFind);


  function findValue() {
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
      svg.selectAll(".findingStatic").remove();
      //remove animated line;
      svg.selectAll(".arrowAnimated").remove();
      // remove hashed keys
      svg.selectAll(".finding").remove();

      findSection
        .append("text")
          .attr("class", "findingStatic unclickedText")
          .attr("id", "findNum")
          .text(find)
          .attr("text-anchor", "middle")
          .attr("x", 250)
          .attr("y", 15);

      findSection
        .insert("rect", "text")
          .attr("class", "findingStatic bBox unclickedBBox")
          .attr("id", "findNumBBox")
          .attr("x", 235)
          .attr("y", -0.5)
          .attr("width", 30)
          .attr("height", 20);

      findSection
        .append("text")
          .attr("class", "findingStatic textBtn unclickedText")
          .attr("id", "hashfindBtn")
          .text("hash&find")
          .attr("x", 150)
          .attr("y", 15)
          .on("click", function () {
            if (!animationLock) {
              // draw the last viz
              drawViz(ehtRecord.slice(-1)[0]);
              findClicked(find);
            }
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

  function findClicked(find) {
    let currentEHT = ehtRecord[insertIdx];
    let hashedKey = currentEHT.hash(find);
    let convKey = currentEHT.getIndex(find);

    //remove animated line;
    svg.selectAll(".arrowAnimated").remove();
    // remove hashed keys
    svg.selectAll(".finding").remove();
    //recover states
    svg.select("#value"+find).attr("fill", "#000");
    svg.select("#key" + convKey).attr("fill", "#000");
    svg.selectAll(".valueTexts").attr("fill", "#000");
    svg.selectAll(".keyText").attr("fill", "#000");

    // update btn color
    svg.select("#hashfindBtn").attr("class", "findingStatic textBtn clickedText");
    svg.select("#hashfindBtnBBox").attr("class", "findingStatic bBox clickedBBox");
    svg.select("#findNum").attr("class", "findingStatic textBtn clickedText");
    svg.select("#findNumBBox").attr("class", "findingStatic bBox clickedBBox");

    // set all unlicked to clicked
    svg.selectAll(".unclickedText").attr("class", "textBtn clickedText");
    svg.selectAll(".unclickedBBox").attr("class", "bBox clickedBBox");

    findSection
      .append("text")
        .attr("class", "finding")
        .attr("id", "hashedfind")
        .text(hashedKey)
        .attr("text-anchor", "end")
        .attr("x", 300)
        .attr("y", 15)
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
      .transition().attr("fill", "#f00");

    //animated line
    let arrow = svg.select("#arrow"+convKey);
    arrow.each(function() {
      let tempArrow = arrowPart
        .append("path")
          .transition().delay(500)
            .attr("d", this.getAttribute('d'))
            .attr("class", "arrowAnimated");
    })

    svg.select("#key" + convKey).transition().delay(500)
      .attr("fill", "#f00");

    findSection
      .append("text")
        .attr("class", "finding")
        .text(hashedKey.slice(-currentEHT.globalDepth))
        .attr("text-anchor", "end")
        .attr("x", 300)
        .attr("y", 15)
        .attr("x", function () {
          return 275 + findFindHashedBBox().width
        })
        .transition().delay(500)
          .attr("fill", "#f00");

    svg.select("#value"+find)
      .transition().delay(1000)
        .attr("fill", "#f00");

  }
}
//
EHT_vis();
