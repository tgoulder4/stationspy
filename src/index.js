import { trackTrain } from "./trackTrain.ts";
trackTrain("P71032").then((emitter) => {
  emitter.on("journeyUpdate", (update) => console.log(update));
  emitter.on("errorUpdate", (data) => console.log(data));
});
