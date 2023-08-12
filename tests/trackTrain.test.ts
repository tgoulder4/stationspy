const {
  getCurrentState,
  getHTML,
  getStationNameAndCode,
  stateObject,
  errorObject,
} = require("../src/trackTrain");
const { expect, describe, test } = require("@jest/globals");
//----
const {
  serviceCancelled,
  departedStoppingStation,
  passUnknownDelay,
  passedPassStation,
  reachedDestination,
  arriving,
} = require("./testHTMLData");
const cheerio = require("cheerio");
let html,
  $ = "";

describe("Erronous", () => {
  // 1-Partially-cancelled-routes
  // test("partially cancelled", async () => {
  //   html = await erronousData.partiallyCancelled();
  //   $ = cheerio.load(html);
  //   const state = getCurrentState($);
  //   expect(state).toStrictEqual(
  //   //AMEND ERROR OBJECT
  //     errorObject("Not found", "Please enter a valid station code.")
  //   );
  // });
  test("not found", async () => {
    html = await getHTML(
      "https://www.realtimetrains.co.uk/service/gb-nr:aaaa/2023-07-22/detailed"
    );
    $ = cheerio.load(html);
    const state = getCurrentState($);
    expect(state).toStrictEqual(
      errorObject("Not found", "Please enter a valid station code.")
    );
  });
  test("service cancelled", async () => {
    html = await serviceCancelled();
    $ = cheerio.load(html);
    const state = getCurrentState($);
    expect(state).toStrictEqual(
      errorObject(
        "This service is cancelled.",
        "This service was cancelled due to the train operator's request (TB)."
      )
    );
  });
});
describe("Normal", () => {
  test("Departed stopping station with unknown delay", async () => {
    html = await departedStoppingStation();
    $ = cheerio.load(html);
    expect(getCurrentState($)).toStrictEqual(
      stateObject(
        "Departed",
        {
          name: "Small Heath",
          code: "[SMA]",
          arrival: { actual: "1549¾", scheduled: "1551" },
          platform: { actual: "4", scheduled: null },
          departure: { actual: "1552", scheduled: "1552" },
          stopsHere: true,
        },
        { name: "Worcester Foregate Street", code: "[WOF]" },
        null,
        "journey",
        "continue"
      )
    );
  });
  test("Pass with unknown delay", async () => {
    html = await passUnknownDelay();
    $ = cheerio.load(html);
    expect(getCurrentState($)).toStrictEqual(
      stateObject(
        "Passed",
        {
          name: "Soho South Jn",
          code: "[XOS]",
          arrival: { actual: null, scheduled: null },
          platform: { actual: null, scheduled: null },
          departure: { actual: "0537½", scheduled: "0537½" },
          stopsHere: false,
        },
        { name: "Liverpool Lime Street", code: "[LIV]" },
        null,
        "journey",
        "continue"
      )
    );
  });
  test("Passed status on passing station", async () => {
    html = await passedPassStation();
    $ = cheerio.load(html);
    expect(getCurrentState($)).toStrictEqual(
      stateObject(
        "Passed",
        {
          name: "Proof House Jn",
          code: "[XOZ]",
          arrival: { actual: null, scheduled: null },
          platform: { actual: null, scheduled: null },
          departure: { actual: "2236¾", scheduled: "2235½" },
          stopsHere: false,
        },
        { name: "Wolverhampton Cs", code: null },
        "+1",
        "journey",
        "continue"
      )
    );
  });
  test("Reached destination", async () => {
    html = await reachedDestination();
    $ = cheerio.load(html);
    expect(getCurrentState($)).toStrictEqual(
      stateObject(
        "Reached destination",
        {
          name: "Wolverhampton Cs",
          code: null,
          arrival: { actual: "2309", scheduled: "2313" },
          platform: { actual: "4", scheduled: null },
          departure: { actual: null, scheduled: null },
          stopsHere: true,
        },
        { name: "Wolverhampton Cs", code: null },
        "-4",
        "journey",
        "end"
      )
    );
  });
  test("Arriving, unknown delay", async () => {
    html = await arriving();
    $ = cheerio.load(html);
    expect(getCurrentState($)).toStrictEqual(
      stateObject(
        "Arriving",
        {
          name: "Birmingham Moor Street",
          code: "[BMO]",
          arrival: { actual: "1555", scheduled: "1555½" },
          platform: { actual: "2", scheduled: null },
          departure: { actual: null, scheduled: "1557" },
          stopsHere: true,
        },
        { name: "Worcester Foregate Street", code: "[WOF]" },
        null,
        "journey",
        "continue"
      )
    );
  });
});
describe("GetStationNameCode", () => {
  test("Normal", () => {
    expect(getStationNameAndCode("Wolverhampton [WVH]")).toStrictEqual({
      name: "Wolverhampton",
      code: "[WVH]",
    });
    expect(getStationNameAndCode("Tyseley L.M.D. [XTS]")).toStrictEqual({
      name: "Tyseley L.M.D.",
      code: "[XTS]",
    });
  });
});
