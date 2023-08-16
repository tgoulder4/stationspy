import { trackTrain } from "./trackTrain.js";
trackTrain("G60079").then((emitter) => {
  emitter.on("journeyUpdate", (update) => console.log(update));
  emitter.on("errorUpdate", (data) => console.log(data));
});
