import findTrains from "./findTrains";
import { trackTrain } from "./trackTrain";
const util = require("util");
// module.exports = {
//   findTrains,
//   trackTrain,
// };
(async () => {
  const trains = await findTrains("WLF");
  console.log(
    util.inspect(trains, { showHidden: false, depth: null, colors: true })
  );
})();
