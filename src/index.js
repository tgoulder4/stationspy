const { trackTrain } = require("./trackTrain.js");
trackTrain("G26103").then((emitter) => {
  emitter.on("journeyUpdate", (update) => console.log(update));
  emitter.on("errorUpdate", (data) => console.log(data));
});
