import findTrains from "./findTrains";
import { trackTrain } from "./trackTrain";
const util = require("util");
// module.exports = {
//   findTrains,
//   trackTrain,
// };

trackTrain("P71896", "2023-08-19").then((emitter) =>
  emitter.on("journey", (data) =>
    console.log(
      util.inspect(data, { showHidden: false, depth: null, colors: true })
    )
  )
);
