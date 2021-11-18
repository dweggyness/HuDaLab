
/** Implementation of Bloom Filters in JS */
// Based on https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/


// @@@@@@@@@@@@@@@@@@@@@
// set this to true if you want to see a step by step of commands being run
const DEBUG_FLAG = 1;

class BloomFilter {
  constructor(arrSize = 25) {
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

  // hashes a str on all the hash functions and returns it as an object
  hash(str) {
    const hash1 = this.hash1(str);
    const hash2 = this.hash2(str);
    const hash3 = this.hash3(str);

    if (DEBUG_FLAG) {
      console.log(`Hashing "${str}"`);
      console.log(`Hash1 - ${hash1}`);
      console.log(`Hash2 - ${hash2}`);
      console.log(`Hash3 - ${hash3}`);
    }

    return { hash1, hash2, hash3 }
  }

  // hashes the string, and sets the bits at the hash indexes to 1.
  insert(str) {
    if (DEBUG_FLAG) console.log(`Inserting "${str}"`);
    const { hash1, hash2, hash3 } = this.hash(str);

    this.array[hash1] = 1;
    this.array[hash2] = 1;
    this.array[hash3] = 1;

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
    const { hash1, hash2, hash3 } = this.hash(str);
    if (DEBUG_FLAG) console.log(`\nFinding "${str}" in BFT`);

    // if all the bits are '1', its possible that the {str} exists in the bloom filter.
    if (this.array[hash1] && this.array[hash2] && this.array[hash3]) {
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

function main() {
  const BFT = new BloomFilter(20);

  const INPUT_ARRAY = [
    'cat', 'dog', 'fish', 'hippo', 'owl', 'tiger', 'elephant',
    'parrot', 'giraffe', 'chicken', 'hamster', 'sheep'
  ]

  shuffle(INPUT_ARRAY);

  // random insert X strings into the Bloom Filter
  // higher chance of false positives if you insert more elements
  // or if the BFT size is smaller
  
  // maximum of 12 elementts please theres only 12 elements in INPUT_ARRAY
  const NUM_ELEMS_TO_INSERT = 6;

  // random search for X strings into the Bloom Filter
  const NUM_ELEMS_TO_FIND = 10;

  if (DEBUG_FLAG) console.log("\n Inserting... \n \n");
  // insert into BFT.
  for (let i = 0; i < NUM_ELEMS_TO_INSERT; i++) {
    const strToInsert = INPUT_ARRAY[i];
    BFT.insert(strToInsert);
  }

  // reshuffle so you get new order of elements
  shuffle(INPUT_ARRAY);

  if (DEBUG_FLAG) {
    console.log("\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("\nDone Inserting.");
    console.log(" \n Finding...");
    console.log(`Words in the BFT : ${BFT.arrayOfElems}\n`);
  }
  // find from BFT
  for (let i = 0; i < NUM_ELEMS_TO_FIND; i++) {
    const str = INPUT_ARRAY[i];
    const findResult = BFT.find(str);
    if (DEBUG_FLAG) console.log(`Find Result: - ${findResult}`);
  }
}

main();