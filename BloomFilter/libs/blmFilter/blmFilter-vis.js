function BFT_vis() {
  /** Implementation of Bloom Filters in JS */
  // Based on https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/


  // @@@@@@@@@@@@@@@@@@@@@
  // set this to true if you want to see a step by step of commands being run
  const DEBUG_FLAG = 0;

  class BloomFilter {
    constructor(arrSize = 20, hashSize = 3) {
      this.hashSize = hashSize;
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

    // hash 4
    // linear adding, with a bit shift
    hash4(str) {
      let hash = 0;
      for (var i = 0; i < str.length; i++) {
          const curChar = str[i];
          const curCharASCII = curChar.charCodeAt(0);
          hash = ((hash<<3)) + curCharASCII;
          hash = hash % this.arrSize;
      }
      return hash;
    }

    // hashes a str on all the hash functions and returns it as an object
    hash(str) {
      const hash1 = this.hash1(str);
      const hash2 = this.hash2(str);
      const hash3 = this.hash3(str);
      const hash4 = this.hash4(str);

      if (DEBUG_FLAG) {
        console.log(`Hashing "${str}"`);
        console.log(`Hash1 - ${hash1}`);
        console.log(`Hash2 - ${hash2}`);
        console.log(`Hash3 - ${hash3}`);
      }

      return [ hash1, hash2, hash3, hash4 ]
    }

    // hashes the string, and sets the bits at the hash indexes to 1.
    insert(str) {
      if (DEBUG_FLAG) console.log(`Inserting "${str}"`);
      let hashResults = this.hash(str);

      for (var i = 0; i < this.hashSize; i++) {
        this.array[hashResults[i]] = 1;
      }


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
      let hashResults = this.hash(str);

      // if all the bits are '1', its possible that the {str} exists in the bloom filter.
      let allOne = true;
      for (var i = 0; i < result.length; i++) {
        allOne = allOne && this.array[hashResults[i]];
      }

      if (allOne) {
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

    // deepcopyto(tempBFT) {
    //   tempBFT.arrSize = this.arrSize;
    //   tempBFT.array = JSON.parse(JSON.stringify(this.array));
    //   tempBFT.arrayOfElems = JSON.parse(JSON.stringify(this.arrayOfElems));
    // }

    // change this.arrSize to newSize
    // keep the elements, rehash.
    changeSize(newSize) {
      this.arrSize = newSize;
      this.array = [];
      // initialize the array to be an array of 'zero bits' of size {this.size}
      for (let i = 0; i < this.arrSize; i++) {
        this.array[i] = 0
      }
      // rehash all the elements
      for (var i = 0; i < this.arrayOfElems.length; i++) {
        const hashResults = this.hash(this.arrayOfElems[i]);

        for (var j = 0; j < this.hashSize; j++) {
          this.array[hashResults[j]] = 1;
        }
      }
    }

    changeHash(newHash) {
      this.hashSize = newHash;
      this.array = [];
      // initialize the array to be an array of 'zero bits' of size {this.size}
      for (let i = 0; i < this.arrSize; i++) {
        this.array[i] = 0
      }
      // rehash all the elements
      for (var i = 0; i < this.arrayOfElems.length; i++) {
        const hashResults = this.hash(this.arrayOfElems[i]);

        for (var j = 0; j < this.hashSize; j++) {
          this.array[hashResults[j]] = 1;
        }
      }
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

  // https://en.wikipedia.org/wiki/Bloom_filter
  // https://gist.github.com/brandt/8f9ab3ceae37562a2841
  // Given number of elems to insert into bloom filter, returns the optimal bloom filter size
  // for a false positive rate of 1%
  function getOptimalBloomFilterSize(numberOfElems) {
    const TARGET_FALSE_POSITIVE_RATE = 0.20;
    const numerator = numberOfElems * Math.abs(Math.log(TARGET_FALSE_POSITIVE_RATE));
    const denominator = Math.log(2) ** 2
    const result = Math.round(numerator / denominator);
    return result;
  }

  // https://en.wikipedia.org/wiki/Bloom_filter
  // https://gist.github.com/brandt/8f9ab3ceae37562a2841
  // Given number of elems to insert into bloom filter and bit array size, returns optimal
  // number of hash functions
  function getOptimalNumberOfHashFunctions(arrayBitSize, numberOfElems) {
    let result = (arrayBitSize / numberOfElems) * Math.log(2);
    result = Math.round(result);
    return result;
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
  recomText.setAttribute("class", "buttonText");
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
      .attr("x", 550)
      .attr("y", 10)
      .attr("class", "section-title")
      ;

  // display three hash functions;
  let hash0Text = vizSection
      .append("text")
        .text("Hash")
        .attr("x", 450)
        .attr("y", -20)
        ;
  let hash1Text = vizSection
      .append("text")
        .text("Hash function 1 result:")
        .attr("id", "hashText1")
        .attr("x", 450)
        .attr("y", 10)
        ;
  let hash1FunctionText = vizSection
      .append("text")
        .text("( Summation Hash:  Hash += ASCII of letter )")
        .attr("id", "hashFunctionText1")
        .attr("x", 450)
        .attr("y", 30)
        ;
  let hash2Text = vizSection
      .append("text")
        .text("Hash function 2 result:")
        .attr("id", "hashText2")
        .attr("x", 450)
        .attr("y", 60)
        ;
  let hash2FunctionText = vizSection
      .append("text")
        .text("( Quadratic Hash:  Hash += ASCII of letter * 19^(Index of letter))")
        .attr("id", "hashFunctionText2")
        .attr("x", 450)
        .attr("y", 80)
        ;
  let hash3Text = vizSection
      .append("text")
        .text("Hash function 3 result:")
        .attr("id", "hashText3")
        .attr("x", 450)
        .attr("y", 110)
        ;
  
  let hash3FunctionText = vizSection
        .append("text")
          .text("( Polynomial Hash:  Hash = Hash * 31 + ASCII of letter )")
          .attr("id", "hashFunctionText3")
          .attr("x", 450)
          .attr("y", 130)
          ;
  let hash4Text = vizSection
      .append("text")
        .text("Hash function 4 result:")
        .attr("id", "hashText4")
        .attr("x", 450)
        .attr("y", 160)
        .attr("display", "none")
        ;

  let hash4FunctionText = vizSection
        .append("text")
          .text("( Cyclic Hash:  Hash = (Hash<<3) + ASCII of letter )")
          .attr("id", "hashFunctionText4")
          .attr("x", 450)
          .attr("y", 180)
          .attr("display", "none")
          ;

  let hashStr = vizSection
      .append("text")
        .attr("id", "hashStr")
        .text("string")
        .attr("x", 500)
        .attr("y", -20)
        ;
  let hash1Result = vizSection
      .append("text")
        .attr("id", "hash1Res")
        .text("Res1")
        .attr("x", 625)
        .attr("y", 10)
        ;
  let hash2Result = vizSection
      .append("text")
        .attr("id", "hash2Res")
        .text("Res2")
        .attr("x", 625)
        .attr("y", 60)
        ;
  let hash3Result = vizSection
      .append("text")
        .attr("id", "hash3Res")
        .text("Res3")
        .attr("x", 625)
        .attr("y", 110)
        ;
  let hash4Result = vizSection
      .append("text")
        .attr("id", "hash4Res")
        .text("Res4")
        .attr("x", 625)
        .attr("y", 160)
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
      'cat', 'cattle', 'dog', 'donkey', 'goat',
      'horse', 'pig', 'rabbit', 'chicken', 'alligator',
      'buffalo', 'elephant', 'leopard', 'pigeon', 'duck',
      'goose', 'sheep', 'albatross', 'robin', 'alpaca',
      'anaconda', 'angelfish', 'fox', 'crab', 'ape',
      'ant', 'bat', 'bee', 'bison', 'whale',
      'butterfly', 'camel', 'caterpillar', 'cheetah',
      'chameleon', 'crane', 'cow', 'deer', 'dolphin',
      'worm', 'eel', 'falcon', 'flamingo', 'frog',
      'panda', 'squid', 'giraffe', 'gibbon', 'bear',
      'hawk', 'hedgehog', 'hippo', 'horse', 'hornet',
      'hyena', 'kangaroo', 'iguana', 'koi', 'ladybug',
      'snail', 'mackarel', 'lobster', 'llama', 'manta',
      'lizard', 'mouse', 'ocelot', 'octopus', 'owl',
      'ox', 'otter', 'ostrich', 'orca', 'parrot',
      'piranha', 'pony', 'possum', 'raccoon', 'reindeer',
      'salmon', 'lion', 'slug', 'shrimp', 'sloth',
      'stingray', 'tapir', 'termite', 'tiger', 'spider',
      'toad', 'warbler', 'wolf', 'zebra', 'turkey',
      'goldfish', 'guppy', 'dove', 'vulture', 'weasel',
      'raven', 'pigeon', 'eagle', 'falcon', 'flamingo',
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
  sizeText.setAttribute("class", "buttonText");
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
  hashText.setAttribute("class", "buttonText");
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
  numText.setAttribute("class", "buttonText");
  numText.innerHTML = "# of values to insert:";
  document.getElementById("bft-divIniNum").appendChild(numText);
  document.getElementById("bft-divIniNum").appendChild(userNum);


  function iniBFT() {
    newIniNum = parseFloat(userNum.value);
    userNum.value = '';
    // check if num is valid
    if (newIniNum < 0 || newIniNum % 1 !== 0 || newIniNum > 30){
      alert("Please enter a valid number! \n A valid number is a positive integer <= 30.")
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
  insertText.setAttribute("class", "buttonText");
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
      svg.select("#hashFunctionText" + i).attr("display", i <= BFT.hashSize ? "block":"none");
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
  findText.setAttribute("class", "buttonText");
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
