

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // main Viz helper functions
  function getDataY(d, i) {
    return y = i*20 -20
  }
  function getTextLocationY(d, i) {
    return Math.max(0, (BFT.arrSize-10)*10) + 100 + (i-Math.floor((BFT.arrayOfElems.length)/2))*28;
  }
  function getTextLocation(d, i) {
    let x = 100;
    let y = getTextLocationY(d,i);
    return "translate(" + x + "," + y + ")"
  }

  // getbbox function
  function findTextBBox(d) {
    return svg.select("#text" + d).node().getBBox();
  }
  function findHashStrBBox () {
    return svg.select("#hashStr").node().getBBox();
  }
  function findHash1BBox() {
    return svg.select("#hash1Res").node().getBBox();
  }
  function findHash2BBox() {
    return svg.select("#hash2Res").node().getBBox();
  }
  function findHash3BBox() {
    return svg.select("#hash3Res").node().getBBox();
  }
  function findHash4BBox() {
    return svg.select("#hash4Res").node().getBBox();
  }
  function findFindBBox() {
    return svg.select("#findText").node().getBBox();
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

  // add container for param BUTTONS
  var btnDiv2 = document.createElement("div");
  btnDiv2.setAttribute("id", "bft-button-container-2");
  btnDiv2.setAttribute("class", "button-container");
  document.getElementById("bft-container").appendChild(btnDiv2);

  // add container for hint
  var recomParamDiv = document.createElement("div");
  recomParamDiv.setAttribute("id", "bft-recom-container");
  document.getElementById("bft-container").appendChild(recomParamDiv);
  let recomText = document.createElement("p");
  recomText.innerHTML = '';
  recomText.setAttribute("class", "btnText");
  recomParamDiv.setAttribute("style", "padding-left:5px;");
  recomText.setAttribute("style", "margin:0;");
  document.getElementById("bft-recom-container").appendChild(recomText);

  // add container for insert/find BUTTONS
  var btnDiv1 = document.createElement("div");
  btnDiv1.setAttribute("id", "bft-button-container-1");
  btnDiv1.setAttribute("class", "button-container");
  document.getElementById("bft-container").appendChild(btnDiv1);


  var svg = d3.select("#bft-container")
      .append("svg")
        // .attr("width", 600 + 'px')
        // .attr("height", 600 + 'px')
        .attr("viewBox" , "0 0 900 600")
        // .attr("preserveAspectRatio","none")
        // .attr("width", width + margin.left + margin.right)
        // .attr("height", height + margin.top + margin.bottom)
        .attr("id", "bft-canvas")
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
  let findArrowPart = vizSection.append("g").attr("class", "findArrowPart");
  let findPart = vizSection.append("g").attr("class", "findPart");

  // section titles
  svg.append("text")
      .text("State of bloom filter")
      .attr("x", 200)
      .attr("y", 10)
      .attr("class", "section-title")
      ;
  svg.append("text")
      .text("Hash functions")
      .attr("x", 600)
      .attr("y", 10)
      .attr("class", "section-title")
      ;

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
        .attr("id", "hashText1")
        .attr("x", 500)
        .attr("y", 10)
        ;
  let hash2Text = vizSection
      .append("text")
        .text("Hash function 2 result:")
        .attr("id", "hashText2")
        .attr("x", 500)
        .attr("y", 40)
        ;
  let hash3Text = vizSection
      .append("text")
        .text("Hash function 3 result:")
        .attr("id", "hashText3")
        .attr("x", 500)
        .attr("y", 70)
        ;
  let hash4Text = vizSection
      .append("text")
        .text("Hash function 4 result:")
        .attr("id", "hashText4")
        .attr("x", 500)
        .attr("y", 100)
        .attr("display", "none")
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
  let hash4Result = vizSection
      .append("text")
        .attr("id", "hash4Res")
        .text("Res4")
        .attr("x", 675)
        .attr("y", 100)
        .attr("display", "none")
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

  let hash4BBox = vizSection
    .insert("rect", "text")
      .attr("id", "hash4ResBBox")
      .attr("class", "bBox")
      .attr("x", function () {
        return findHash4BBox().x - textBlockPaddingX;
      })
      .attr("y", function () {
        return findHash4BBox().y - textBlockPaddingY;
      })
      .attr("width", function () {
        return findHash4BBox().width + 2*textBlockPaddingX;
      })
      .attr("height", function () {
        return findHash4BBox().height + 2*textBlockPaddingY;
      })
      .attr("fill", "#e0faec")
      .attr("stroke", "#3fbc77")
      .attr("display", "none")
      ;




  const INPUT_ARRAY = [
    'cat', 'dog', 'fish', 'hippo', 'owl', 'tiger', 'elephant',
    'parrot', 'giraffe', 'chicken', 'hamster', 'sheep'
  ]
  var arraySize = 20;
  var hashSize = 3;

  const BFT = new BloomFilter(arraySize);
  // global state for find, if user input a string to find, then find=string; else=null
  var find = null;

  var newHash;
  var newSize;
  var newIniNum;

  drawViz(BFT);

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // User Initiate Bloom Filter Size

  // create a seperate div for each interactive part
  let userSizeDiv = document.createElement("div");
  userSizeDiv.setAttribute("class", "btndiv");
  userSizeDiv.setAttribute("id", "bft-divIniSize");
  document.getElementById("bft-button-container-2").appendChild(userSizeDiv);

  let userSize = document.createElement("INPUT");
  userSize.setAttribute("type", "number");
  userSize.setAttribute("placeholder", 20);
  userSize.setAttribute("id", "userSize");
  userSize.addEventListener("keyup", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      changeSize();
    } else { // change value, so we should change the suggested values for the other parameters
      // get values, and backup values if the field is currently empty
      // value of the field, otherwise, current array size
      const bitArrSize = parseFloat(userSize.value) || arraySize;
      // value of the field, otherwise, current num of elems in BFT, otherwise, 5 elems.
      const numElems = parseFloat(userNum.value) || BFT.arrayOfElems.length || 5;

      recomText.innerHTML = "With current " + numElems + " elements and filter size " + bitArrSize + ", the optimal # of hash functions is " + getOptimalNumberOfHashFunctions(bitArrSize, numElems) +".";
    }
  });

  var sizeText = document.createElement("p");
  sizeText.setAttribute("class", "btnText");
  sizeText.innerHTML = "Bloom filter size:";
  document.getElementById("bft-divIniSize").appendChild(sizeText);
  document.getElementById("bft-divIniSize").appendChild(userSize);


  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // User Initiate Bloom Filter Size
  // create a seperate div for each interactive part
  let userHashDiv = document.createElement("div");
  userHashDiv.setAttribute("class", "btndiv");
  userHashDiv.setAttribute("id", "bft-divIniHash");
  document.getElementById("bft-button-container-2").appendChild(userHashDiv);

  let userHash = document.createElement("INPUT");
  userHash.setAttribute("type", "number");
  userHash.setAttribute("placeholder", "3");
  userHash.setAttribute("id", "userSize");
  userHash.addEventListener("keyup", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      changeHash();
    }
  });

  var hashText = document.createElement("p");
  hashText.setAttribute("class", "btnText");
  hashText.innerHTML = "# of hash functions:";
  document.getElementById("bft-divIniHash").appendChild(hashText);
  document.getElementById("bft-divIniHash").appendChild(userHash);

  function changeSize() {
    newSize = parseFloat(userSize.value);
    userSize.value = '';
    // check if num is valid
    if (newSize < 2 || newSize % 1 !== 0 || newSize > 50){
      alert("Please enter a valid size! \n A valid size is a Positive Integer belonging to [2, 50].")
      newSize = null;
    } else {
      // change canvas size
      desHeight =  600 + Math.max(0, newSize-18)*28;
      desViewBox = "0 0 900 " + desHeight;
      document.getElementById("bft-canvas").setAttribute("viewBox", desViewBox);

      arraySize = newSize;
      BFT.changeSize(newSize);
      userSize.setAttribute("placeholder", newSize);
      drawViz(BFT);
      drawText(BFT);

    }
  }
  function changeHash() {
    newHash = parseFloat(userHash.value);
    userHash.value = '';
    // check if num is valid
    if (newHash < 1 || newHash % 1 !== 0 || newHash > 4){
      alert("Please enter a valid number! \n A valid number is a Positive Integer belonging to [1, 4].")
      newHash = null;
    } else {
      hashSize = newHash;
      BFT.changeHash(newHash);
      userHash.setAttribute("placeholder", newHash);
      drawViz(BFT);
      drawText(BFT);
    }
  }


  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // User Initiate Numbers of Insertion
  // create a seperate div for each interactive part
  let userNumDiv = document.createElement("div");
  userNumDiv.setAttribute("class", "btndiv");
  userNumDiv.setAttribute("id", "bft-divIniNum");
  document.getElementById("bft-button-container-1").appendChild(userNumDiv);

  let userNum = document.createElement("INPUT");
  userNum.setAttribute("type", "number");
  // userNum.setAttribute("placeholder", "Positive integer");
  userNum.value = '5';
  userNum.setAttribute("id", "userNum");
  userNum.addEventListener("keyup", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      iniBFT();
    } else { // change value, so we should change the suggested values for the other parameters
      // get values, and backup values if the field is currently empty
      // value of the field, otherwise, current num of elems in BFT, otherwise, 5 elems.
      const numElems = parseFloat(userNum.value) || BFT.arrayOfElems.length || 5;
      const optimalBloomFilterSize = getOptimalBloomFilterSize(numElems)
      // value of the field, otherwise, optimal array size
      const bitArrSize = parseFloat(userSize.value) || optimalBloomFilterSize;

      recomText.innerHTML = "With current " + numElems + " elements, the optimal filter size is " + optimalBloomFilterSize + ", the optimal # of hash functions is " + getOptimalNumberOfHashFunctions(bitArrSize, numElems) +".";

    }
  });

  var numText = document.createElement("p");
  numText.setAttribute("class", "btnText");
  numText.innerHTML = "# of values to insert:";
  document.getElementById("bft-divIniNum").appendChild(numText);
  document.getElementById("bft-divIniNum").appendChild(userNum);


  function iniBFT() {
    newIniNum = parseFloat(userNum.value);
    userNum.value = '';
    // check if num is valid
    if (newIniNum < 0 || newIniNum % 1 !== 0 || newIniNum > 12){
      alert("Please enter a valid number! \n A valid number is a Positive Integer smaller than 13.")
      newIniNum = null;
    } else {
      // reset BFT
      BFT.clean(arraySize);
      drawViz(BFT);
      drawText(BFT);


      shuffle(INPUT_ARRAY);
      const NUM_ELEMS_TO_INSERT = newIniNum;
      // insert into BFT.
      for (let i = 0; i < NUM_ELEMS_TO_INSERT; i++) {

        const strToInsert = INPUT_ARRAY[i];
        // the following code is equivalent to:
        // BFT.insert(strToInsert);======================
        let hashResults = BFT.hash(strToInsert);

        for (var j = 0; j < BFT.hashSize; j++) {
          BFT.array[hashResults[j]] = 1;
        }

        BFT.arrayOfElems.push(strToInsert);
        // equivalent code ends ==========================


      }
      drawViz(BFT);
      drawText(BFT);
    }
  }

  iniBFT(BFT);
  userNum.value = "5";
  const numElems = parseFloat(userNum.value) || BFT.arrayOfElems.length || 5;
  const optimalBloomFilterSize = getOptimalBloomFilterSize(numElems)
  // value of the field, otherwise, optimal array size
  const bitArrSize = parseFloat(userSize.value) || optimalBloomFilterSize;

  recomText.innerHTML = "With current " + numElems + " elements, the optimal filter size is " + optimalBloomFilterSize + ", the optimal # of hash functions is " + getOptimalNumberOfHashFunctions(bitArrSize, numElems) +".";

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // User Insert New Value
  // create a seperate div for each interactive part
  let userInsertDiv = document.createElement("div");
  userInsertDiv.setAttribute("class", "btndiv");
  userInsertDiv.setAttribute("id", "bft-divInsert");
  document.getElementById("bft-button-container-1").appendChild(userInsertDiv);

  var userInsert = document.createElement("INPUT");
  userInsert.setAttribute("type", "text");
  // userInsert.setAttribute("placeholder", "Any String");
  userInsert.setAttribute("id", "bft-userInsert");
  // upon pressing enter
  userInsert.addEventListener("keyup", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      insertValue();
    }
  });

  var insertText = document.createElement("p");
  insertText.setAttribute("class", "btnText");
  insertText.innerHTML = "Add a value: ";
  document.getElementById("bft-divInsert").appendChild(insertText);
  document.getElementById("bft-divInsert").appendChild(userInsert);

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
    } else if (BFT.arrayOfElems.length > BFT.arrSize) {
      alert("Bloom Filter too full.")
      find = null;
    } else {

      // change canvas size
      desHeight =  600 + Math.max(0, BFT.arrayOfElems.length-12)*28;
      desViewBox = "0 0 900 " + desHeight;
      document.getElementById("bft-canvas").setAttribute("viewBox", desViewBox);

      // draw the last BFT
      drawViz(BFT);
      drawText(BFT);


      // insert into BFT.

      const strToInsert = newInsert;
      // the following code is equivalent to:
      // BFT.insert(strToInsert);======================
      let hashResults = BFT.hash(strToInsert);

      for (var i = 0; i < BFT.hashSize; i++) {
        BFT.array[hashResults[i]] = 1;
      }

      BFT.arrayOfElems.push(strToInsert);
      // equivalent code ends ==========================
      // show optimal parameters
      const numElems = BFT.arrayOfElems.length;
      const optimalBloomFilterSize = getOptimalBloomFilterSize(numElems)
      // value of the field, otherwise, optimal array size
      const bitArrSize = optimalBloomFilterSize;

      recomText.innerHTML = "With current " + numElems + " elements, the optimal filter size is " + optimalBloomFilterSize + ", the optimal # of hash functions is " + getOptimalNumberOfHashFunctions(bitArrSize, numElems) +".";


      drawViz(BFT);
      drawText(BFT);

      textClicked(strToInsert);

      // because new arrows were added at the same time, js could not access the newly added arrows immediatelly, so we add a short delay.
      setTimeout(function () {
        // show arrow animations
        for (var i = 1; i < BFT.hashSize+1; i++) {
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
    svg.selectAll(".arrowAnimated").remove();

    // remove hashed key
    hashStr.text("string");
    hash1Result.text("Res1");
    hash2Result.text("Res2");
    hash3Result.text("Res3");
    hash4Result.text("Res4");

    // show or hide hash results
    for (var i = 1; i < 6; i++) {
      svg.select("#hashText" + i).attr("display", i <= BFT.hashSize ? "block":"none");
      svg.select("#hash" + i +"Res").attr("display", i <= BFT.hashSize ? "block":"none");
      svg.select("#hash" + i + "ResBBox").attr("display", i <= BFT.hashSize ? "block":"none");
    }

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
    hash4BBox
        .attr("x", function () {
          return findHash4BBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHash4BBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHash4BBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHash4BBox().height + 2*textBlockPaddingY;
        });

    drawArrayBG(bft);
    drawArray(bft);
    drawArrow(bft);
    if (find) {
      drawFind(find);
    }
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

    arrayBG
        .append("text")
          .text((d,i) => i)
          .attr("text-anchor", "middle")
          .attr("x", 285)
          .attr("y", (d,i) => getDataY(d,i) + 16);

    let exitingArrayBG = arrayBGGroup.exit();
    exitingArrayBG.remove();


  }
  function drawArray(bft) {
    let data = bft.array;

    let arrayGroup = arrayPart
        .selectAll(".arrayGroup")
          .data(data, function(d, i) {
            return "array"+i
          });

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
    let arrowGroup4 = arrowPart.selectAll(".arrowGroup4").data(data,function (d,i) {
      return "arrow4"+d
    });

    let arrowGroups = [arrowGroup1, arrowGroup2, arrowGroup3, arrowGroup4];

    for (var j = 0; j < 4; j++) {
      // link
      let link = d3.linkHorizontal()
          .source(function (d,i) {
            y = getTextLocationY(d,i);
            return [100+2, y-5]
          })
          .target(function (d,i) {
            idx = bft.hash(d)[j];
            y = getDataY(d, idx);
            return [250, y+10]
          });

      let arrow = arrowGroups[j].enter()
        .append("path")
          .attr("class", "arrowGroup"+(j+1).toString())
          .attr("id", function(d, i) {
            return "arrow" + (j+1).toString() + d
          })
            .transition()
          .attr("d", link)
          .attr("stroke", "#000000");

      arrow.attr("display", function () {
        return (j < bft.hashSize) ? "block":"none"
      });

      let exitingArrow = arrowGroups[j].exit();
      exitingArrow.remove();

      arrowGroups[j].transition()
          .attr("d", link)
          .attr("display", function () {
            return (j < bft.hashSize) ? "block":"none"
          });
    }



  }


  function drawText(bft) {
    let data = bft.arrayOfElems;
    let textGroup = textPart
        .selectAll(".bft-textGroup")
          .data(data, function (d,i) {
            return "text"+d
          });

    let texts = textGroup.enter()
        .append("g")
          .attr("class", "bft-textGroup")
          .attr("id", function(d,i) {
            return "bft-textGroup" + i;
          })
          .attr("transform", getTextLocation)
          .on("click", function(a,d) {
            textClicked(d);
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

  function textClicked(d) {
    console.log("clicked");
    // remove animated line
    svg.selectAll(".arrowAnimated").remove();
    // show hash results
    svg.select("#hashStr").text(d);
    svg.select("#hashStrBBox")
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
    svg.select("#hash1Res").text(BFT.hash1(d));
    svg.select("#hash1ResBBox")
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
    svg.select("#hash2Res").text(BFT.hash2(d));
    svg.select("#hash2ResBBox")
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
    svg.select("#hash3Res").text(BFT.hash3(d));
    svg.select("#hash3ResBBox")
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
    svg.select("#hash4Res").text(BFT.hash4(d));
    svg.select("#hash4ResBBox")
        .attr("x", function () {
          return findHash4BBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHash4BBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHash4BBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHash4BBox().height + 2*textBlockPaddingY;
        });

    // show arrow animations
    for (var i = 1; i < BFT.hashSize+1; i++) {
      let arrow = svg.select("#arrow"+i+d);
      arrow.each(function() {
        let tempArrow = arrowPart
          .append("path")
            .attr("class", "arrowAnimated")
            .attr("d", this.getAttribute('d'));
      })
    }
  }

  //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  // User Find Key
  // create a seperate div for each interactive part
  let userFindDiv = document.createElement("div");
  userFindDiv.setAttribute("class", "btndiv");
  userFindDiv.setAttribute("id", "bft-divFind");
  document.getElementById("bft-button-container-1").appendChild(userFindDiv);

  var userFind = document.createElement("INPUT");
  userFind.setAttribute("type", "text");
  // userFind.setAttribute("placeholder", "Any String");
  userFind.setAttribute("id", "bft-userInsert");
  userFind.addEventListener("keyup", (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      findValue();
    }
  });
  var findText = document.createElement("p");
  findText.setAttribute("class", "btnText");
  findText.innerHTML = "Find a value: ";
  document.getElementById("bft-divFind").appendChild(findText);
  document.getElementById("bft-divFind").appendChild(userFind);

  function findValue() {
    find = userFind.value;

    // clear the input field.
    userFind.value = '';

    // check for validty
    if (find.length > 20 || newInsert ==''){
      alert("Please enter a valid string! \n A valid number is a string with less than 20 letters.")
      find = null;
    } else {
      // remove finding
      svg.selectAll(".finding").remove();

      let findGroup = findPart.append("g")
          .attr("class", "finding")
          .attr("id", "findGroup")
          .attr("transform", "translate(400,200)");

      findGroup
        .append("text")
          .text(find)
          .attr("id", "findText")
          .attr("class", "finding");

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

      // just drawFind, so user don't need to click on it to show
      drawFind(find);
    }
  }

  function drawFind(find) {
    let currBFT = BFT;
    let found = null;

    let hashResults = currBFT.hash(find);

    // if all the bits are '1', its possible that the {str} exists in the bloom filter.
    let allOne = 1;
    for (var i = 0; i < hashResults.length; i++) {
      allOne = allOne && currBFT.array[hashResults[i]];
    }

    if (allOne) {
      if (currBFT.arrayOfElems.includes(find)) { // it actually exists inside the bloom filter
        found =  'Positive'
      } else {
        found = 'False Positive'
      }
    } else { // otherwise, its guaranteed that it does not exist.
      found = 'Negative'
    }

    // draw arrow ===============================================
    // remove finding path and rect
    svg.selectAll(".findingPath").remove();

    let link = d3.linkHorizontal();
    for (var i = 0; i < BFT.hashSize; i++) {
      let linkTarget = [300, getDataY(null, hashResults[i])+10];
      let linkData = {source:[400-2, 200-5], target: linkTarget};
      findArrowPart
        .append("path")
          .attr("class", "finding findingPath")
          .attr("d", link(linkData))
          .attr("stroke", "#000000");
      // draw Array
      // location corresponding to hash1
      if (!currBFT.array[hashResults[i]]) {
        findPart
          .append('rect')
            .attr("class", "finding findingPath")
            .attr("x", 250)
            .attr("y", getDataY(null, hashResults[i]))
            .attr("width", 25)
            .attr("height", 20)
            .attr("stroke", "orange")
            .attr("fill", "#fce5d3");
      }
    }

    // update hash result
    hashStr.text(find);
    hash1Result.text(hashResults[0]);
    hash2Result.text(hashResults[1]);
    hash3Result.text(hashResults[2]);
    hash4Result.text(hashResults[3]);

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

    hash4BBox
        .attr("x", function () {
          return findHash4BBox().x - textBlockPaddingX;
        })
        .attr("y", function () {
          return findHash4BBox().y - textBlockPaddingY;
        })
        .attr("width", function () {
          return findHash4BBox().width + 2*textBlockPaddingX;
        })
        .attr("height", function () {
          return findHash4BBox().height + 2*textBlockPaddingY;
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
      // .attr("font-size", "1.1em")
      ;
    findPart.append("text")
      .text(message2)
      .attr("class", "finding findingPath")
      .attr("x", 380)
      .attr("y", 275)
      // .attr("font-size", "1.1em")
      ;
    findPart.append("text")
        .text(message3)
        .attr("class", "finding findingPath")
        .attr("x", 380)
        .attr("y", 300)
        // .attr("font-size", "1.1em")
        ;
  }
}
//
BFT_vis();