import { variables } from "./trackTrain.js";
import cheerio from "cheerio";
import {
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
} from "../../tests/testHTMLData";
const main = async () => {
  const html = await departedStoppingStation();
  const $ = cheerio.load(html);
  const variablesObj = variables($);
  for (const [key, value] of Object.entries(variablesObj)) {
    if (key != "locationList") {
      console.log(`${key}: ${$(value).html()}`);
    }
  }
};
main();
