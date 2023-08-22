import findTrains from "./findTrains";
import { trackTrain } from "./trackTrain";
module.exports = {
  findTrains,
  trackTrain,
};
const util = require("util");

// trackTrain("G59487").then((emitter) => {
//   emitter.on("journey", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
//   emitter.on("information", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
// });
(async () => {
  const data = await findTrains("BHM");
  console.log(util.inspect(data, false, null, true));
})();
