import trackTrain from "./trackTrain.js";
import findTrains from "./findTrain.js";
export default { trackTrain, findTrains };

trackTrain("L34376").then((emitter) => {
  emitter.on("UPDATE", (update) => {
    console.log(update);
  });
});
