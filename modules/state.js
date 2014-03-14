  /*
     $$$$$$\ $$$$$$$$\  $$$$$$\ $$$$$$$$\ $$$$$$$$\
    $$  __$$\\__$$  __|$$  __$$\\__$$  __|$$  _____|
    $$ /  \__|  $$ |   $$ /  $$ |  $$ |   $$ |
    \$$$$$$\    $$ |   $$$$$$$$ |  $$ |   $$$$$\
     \____$$\   $$ |   $$  __$$ |  $$ |   $$  __|
    $$\   $$ |  $$ |   $$ |  $$ |  $$ |   $$ |
    \$$$$$$  |  $$ |   $$ |  $$ |  $$ |   $$$$$$$$\
     \______/   \__|   \__|  \__|  \__|   \________|
  */

  // vars
  var running = false, // whether or not the reader is running
      instructions,    // the list of instructions
      index,           // the index of the current instruction
      runLoop,         // the run loop timeout
      reader;          // the reader, man.
