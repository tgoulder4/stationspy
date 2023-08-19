import { variables, trackTrain } from "./trackTrain.js";
const cheerio = require("cheerio");
const {
  serviceCancelled,
  departedStoppingStation,
  passUnknownDelay,
  passedPassStation,
  reachedDestination,
  arriving,
  journeyNotFoundTest,
  notYetDeparted,
  approachingAPass,
  partiallyCancelled,
} = require("../../tests/testHTMLData");
const main = async () => {
  trackTrain("vdasaga").then((emitter) => {
    emitter.on("journey", (data) => {
      console.log(data);
    });
    emitter.on("information", (data) => {
      console.log(data);
    });
  });
};
main();
