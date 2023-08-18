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
  // const html = await departedStoppingStation();
  // const $ = cheerio.load(html);
  // const variablesObj = variables($);
  // for (const [key, value] of Object.entries(variablesObj)) {
  //   if (key != "locationList") {
  //     console.log(`${key}: ${$(value)}`);
  //   }
  // }
  trackTrain("G26117").then((emitter) => {
    emitter.on("journey", (data) => {
      console.log(data);
    });
    emitter.on("information", (data) => {
      console.log(data);
    });
  });
};
main();
