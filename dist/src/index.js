"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trackTrain_js_1 = require("./trackTrain.js");
(0, trackTrain_js_1.trackTrain)("G60079").then((emitter) => {
    emitter.on("journeyUpdate", (update) => console.log(update));
    emitter.on("errorUpdate", (data) => console.log(data));
});
