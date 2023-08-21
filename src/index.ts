import findTrains from "./findTrains";
import { trackTrain } from "./trackTrain";
// const util = require("util");
module.exports = {
  findTrains,
  trackTrain,
};

// trackTrain("G59487").then((emitter) => {
//   emitter.on("journey", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
//   emitter.on("information", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
// });
// (async () => {
//   const data = await findTrains("BHM", "2023-08-19")
//   console.log(util.inspect(data, false, null, true));
// })();