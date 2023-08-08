require("dotenv").config();
const { trackTrain } = require("./trackTrain.js");
const findTrains = require("./findTrains.js");
const { atPlatform } = require("../tests/testData/transit/transitData.js");

trackTrain("G55792").then((emitter) => {
  emitter.on("notificationUpdate", (data) => console.log(data));
  emitter.on("journeyUpdate", (data) => console.log(data));
  emitter.on("errorUpdate", (data) => console.log(data));
});
