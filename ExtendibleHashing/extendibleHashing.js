
/** Implementation of Extendible Hashing Tables in JS */
// Based on https://www.geeksforgeeks.org/extendible-hashing-dynamic-approach-to-dbms/
// and https://www.wikiwand.com/en/Extendible_hashing


// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// Some considerations for this implementation of Extendible Hashing which may be different from 
// the online implementation previously linked.

// --- Pointers aren't easily/directly accessible in JS unlike in C/C++
/* However, it is possible to have a variable point to another object, and have 2 objects point to the same object
by doing
object1 = object2;
https://stackoverflow.com/questions/17382427/are-there-pointers-in-javascript
*/

// --- We will be using JSON inputs for D3, so the datatypes I use should be able to be able to be converted
// - into a JSON format without too much resistance.
/* https://www.ibm.com/docs/en/baw/19.x?topic=format-json-properties-data-type-conversions
JSON supported datatypes : String, Number, Boolean
Note: It is possible to convert an Array into/from a String so it works with JSON. 
Uncertain how D3 works so I'm not certain if this is OK, but otherwise there is a D3-array library
https://github.com/d3/d3-array so I'm able to use Arrays for the implementation of directories
Note: Maps/Dictionaries are basically just Objects so thats fine too for D3 ( from my current understanding ),
so I'll be able to use Objects to represent the Buckets
*/

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// Other design choices I've made and my rationale:
// --- Supported types: Only POSITIVE ints 
/* Since this is just for visualization purposes, we can limit user inputs to just Positive Ints, they don't really
need string inputs to understand how it works...
*/

// --- Attempt to split up functionality into many functions
/* So that it is easier to attach logging functions and keep track of whats happening and to animate each step
in D3.js . Even if something is not in a function, it shouldn't be too hard to convert it into a function
*/

// @@@@@@@@@@@@@@@@@@@@@
// Current known limitations
// --- Only works with Binary Hash at the moment, i'm not sure how to implement it for hashes that reeturns results
// other than '0' and '1's



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

  // helper function to display and debug and look around
  display() {
    console.log("Global depth:", this.globalDepth, " Bucket size:", bucketSize, "\n");
    for (var i = 0; i < (1 << this.globalDepth); i++) {
      process.stdout.write(this.hash(i).slice(-this.globalDepth).padStart(this.globalDepth, "0"));
      process.stdout.write(" - ");
      process.stdout.write("Depth: " + this.directories[i].localDepth + " ");
      console.log(this.directories[i].data);
      

    }
  }
}

function main() {
  const EHT = new ExtendibleHashingTable();

  const NUM_ELEMS_TO_INSERT = 35
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
  /////////////////////////////

  EHT.display();
}

main();