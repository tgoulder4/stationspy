import trackTrain from "./trackTrain.js";
import findTrains from "./findTrains.js";
export default { trackTrain, findTrains };

trackTrain("P70601").then((emitter) => {
  emitter.on("UPDATE", (data) => console.log(data));
});
