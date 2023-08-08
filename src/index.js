import trackTrain from "./trackTrain.js";
import findTrains from "./findTrains.js";
export default { trackTrain, findTrains };

findTrains("").then((result) => console.log(result));
