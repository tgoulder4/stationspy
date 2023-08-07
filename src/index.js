import trackTrain from "./trackTrain.js";
import findTrainsByStation from "./findTrain.js";
export default { trackTrain, findTrainsByStation };
trackTrain("G26025");
//subscribe to the trackTrainEmitter. subscription(update=>console.log(update))

//method: input service id to track & return updates
