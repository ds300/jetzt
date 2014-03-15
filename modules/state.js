/*
   Licensed under the Apache License v2.0.
            
   A copy of which can be found at the root of this distrubution in 
   the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0
*/

// vars
var running = false, // whether or not the reader is running
    instructions,    // the list of instructions
    index,           // the index of the current instruction
    runLoop,         // the run loop timeout
    reader;          // the reader, man.
