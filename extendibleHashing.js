
/** Implementation of Extendible Hashing Tables in JS */
// Based on https://www.geeksforgeeks.org/extendible-hashing-dynamic-approach-to-dbms/


// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
// Some considerations for this implementation of Extendible Hashing which may be different from 
// the online implementation previously linked.

// --- Pointers aren't easily accessible in JS unlike in C/C++
/* I'll use a Map instead for the global directories, with a String key to represent the container, and an Array
value which is the bucket it is pointing to.
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
// Supported types: Only POSITIVE ints 
/* Since this is just for visualization purposes, we can limit user inputs to just Positive Ints, they don't really
need string inputs to understand how it works...
*/

class ExtendibleHashingTable {
  constructor() {
    this.globalDepth = 1;
    this.localDepth = 4;
  }

  /* Hashes {data} based on {selectedHashFunction} and returns the hashed result.
  @param {int} data - The input to be hashed
  @param {int} selectedHashFunction - Used to select the hash function to use.
  1 (Default) - Binary Hash
  @returns {string} Hashed data.
  */
  hash(data, selectedHashFunction = 1) {
    let hashedData;
    if (selectionHashFunction == 1) {
      hashedData = data.toString(2);
    }
    return hashedData;
  }
}

function main() {
  console.log('hello');
}

main();