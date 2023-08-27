"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findTrains_1 = require("./findTrains");
const trackTrain_1 = require("./trackTrain");
module.exports = {
    findTrains: findTrains_1.default,
    trackTrain: trackTrain_1.trackTrain,
};
// const util = require("util");
// // trackTrain("G59487").then((emitter) => {
// //   emitter.on("journey", (data) => {
// //     console.log(util.inspect(data, false, null, true));
// //   });
// //   emitter.on("information", (data) => {
// //     console.log(util.inspect(data, false, null, true));
// //   });
// // });
// (async () => {
//   const data = await getHTML("testServiceID", "2023-01-01");
//   console.log(`DATA IS THIS: ${data}`);
// })();
