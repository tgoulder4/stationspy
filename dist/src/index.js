"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trackTrain_1 = require("./trackTrain");
const util = require("util");
// module.exports = {
//   findTrains,
//   trackTrain,
// };
(0, trackTrain_1.trackTrain)("P71896", "2023-08-19").then((emitter) => emitter.on("journey", (data) => console.log(util.inspect(data, { showHidden: false, depth: null, colors: true }))));
