const trackTrain = require("./trackTrain.js");
const findTrains = require("./findTrains.js");
module.exports = { trackTrain, findTrains };

trackTrain("G26139").then((emitter) => {
  emitter.on("UPDATE", (data) => console.log(data));
});
