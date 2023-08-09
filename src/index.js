require("dotenv").config();
const { trackTrain } = require("./trackTrain.js");
const findTrains = require("./findTrains.js");
const { transitData } = require("../tests/testData/testData.js");

trackTrain("P69962").then((emitter) => {
  emitter.on("journeyUpdate", (update) => console.log(update));
  emitter.on("errorUpdate", (data) => console.log(data));
});

// trackTrain("P70052").then((emitter) => {
//   emitter.on("journeyUpdate", (data) => console.log(data));
//   emitter.on("errorUpdate", (data) => console.log(data));
// });
