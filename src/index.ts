import findTrains from "./findTrains";
import { trackTrain } from "./trackTrain";
// const util = require("util");
module.exports = {
  findTrains,
  trackTrain,
};

// trackTrain("P71987", "2023-08-19").then((emitter) => {
//   emitter.on("journey", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
//   emitter.on("information", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
// });
