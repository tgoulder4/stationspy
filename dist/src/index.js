"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const findTrains_1 = require("./findTrains");
const trackTrain_1 = require("./trackTrain");
const util = require("util");
module.exports = {
    findTrains: findTrains_1.default,
    trackTrain: trackTrain_1.trackTrain,
};
// trackTrain("Smethwick Rolfe Street", "2023-08-19").then((emitter) => {
//   emitter.on("journey", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
//   emitter.on("information", (data) => {
//     console.log(util.inspect(data, false, null, true));
//   });
// });
(() => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (0, findTrains_1.default)("ABC", "2023-08-19");
    console.log(util.inspect(data, false, null, true));
}))();
