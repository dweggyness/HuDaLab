
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
https://github.com/d3/d3-array so I'm able to use Arrays for the implementation of buckets
Note: Maps/Dictionaries are basically just Objects so thats fine too for D3 ( from my current understanding ),
so I'll be able to use Objects to represent the Directories
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

class Bucket {
  constructor(localDepth = 1) {
    this.data = {}
    this.localDepth = localDepth;
  }
}

class ExtendibleHashingTable {
  constructor() {
    this.globalDepth = 0;
    this.bucketSize = 2;
    this.directories = [];
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

  /* Inserts {input} into bucket {key}
  @param {int} key - The bucket
  @param {int} input - The input to be inserted
  */
  insertIntoBucket(input) {
    this.directories[key].data.push(input);
  }

  incrementDepthSizeOfBucket(key) {
    this.directories[key].localDepth++;
  }

  /* Increases the globalDepth/ directory size by 1 and inserts new buckets into the directory
  // e.g { "0": [], "1": []} --> { "00": [], "01": [], "10": [], "11": [] }
  */
  growDirectories() {
    // bitwise shift, so if this.globalDepth == 2, then i = 4 (binary: 100), GD = 3, then i = 8 (binary: 1000), etc
    for ( var i = 1; 1 << this.globalDepth; i) {
      // convert each int, 1,2,3,4 into a binary representation of length globalDepth + 1
      // which will be used as the keys for the directories
      const curKey = i.toString(2).slice(-1 -this.globalDepth); 

    }
    this.globalDepth++;
  }

  
  
  /* Inserts {data} into bucket {key}
  @param {int} key - The bucket
  @return {bool} whether the bucket is full or still has space
  */
  isBucketFull(key) {
    if (this.directories[key].data.length >= this.bucketSize){
      return true;
    }
    return false;
  }

  /* Inserts {data}, hashing it before inserting into the Extendible Hashing Table
  @param {int} data - The input to be inserted
  */
  insertIntoTable(data) {
    const hashedData = this.hash(data);
    // generate the key by extracting LAST {globalDepth} characters from hashedData
    const key = hashedData.slice(-globalDepth);

    if (key in this.directories) {
      const bucket = this.directories[key];
      this.insertIntoBucket(data);

      if (this.isBucketFull(key)) {
        if (bucket.localDepth == this.globalDepth) {
          this.growDirectories();
        }
      }

      
    } else {
      throw new Error(`"ERROR! Key ${key} from data ${data} does not exist in the directory. This should not be possible."`)
    }
  }
}

function main() {
  const extendibleHashingTable = new ExtendibleHashingTable();
}

main();