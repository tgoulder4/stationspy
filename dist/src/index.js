"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findTrains_1 = require("./findTrains");
const trackTrain_1 = require("./trackTrain");
// const util = require("util");
module.exports = {
    findTrains: findTrains_1.default,
    trackTrain: trackTrain_1.trackTrain,
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
