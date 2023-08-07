import trackTrain from "./trackTrain.js";
import findTrainsByStation from "./findTrain.js";
export default { trackTrain, findTrainsByStation };
const main = async () => {
  //myTrain must be in an asynchronous atmosphere.
  const myTrain = await trackTrain("P71733");
  // on an update,
  myTrain.on("UPDATE", (currentState) => {
    //print the update
    console.log(currentState);
  });
};
main();
