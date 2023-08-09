require("dotenv").config();
const { trackTrain } = require("./trackTrain.js");
const findTrains = require("./findTrains.js");
const { atPlatform } = require("../tests/testData/transit/transitData.js");

trackTrain("P70052").then((emitter) => {
  emitter.on("journeyUpdate", (data) => console.log(data));
  emitter.on("errorUpdate", (data) => console.log(data));
});
