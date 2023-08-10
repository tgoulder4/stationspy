const {
  getCurrentState,
  getHTML,
  getStationNameAndCode,
  stateObject,
  errorObject,
} = require("../src/trackTrain");
const { expect, describe, it, test } = require("@jest/globals");
const { transitData, erronousData } = require("./testData");
const cheerio = require("cheerio");
let html,
  $ = "";

// test("returns html", expect(trackTrain.getHTML("")).toBeTruthy());
describe("Erronous", () => {
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
    html = await erronousData.serviceCancelled();
    $ = cheerio.load(html);
    const state = await getCurrentState($);
    expect(state).toStrictEqual(
      errorObject(
        "This service is cancelled.",
        "This service was cancelled due to the train operator's request (TB)."
      )
    );
  });
});
describe("Normal", () => {
  test("Departed status on stopping station", async () => {
    html = await transitData.departedStoppingStation();
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
        "-1",
        "journey",
        "continue"
      )
    );
  });
  test("Pass with unknown delay", async () => {
    html = await transitData.passUnknownDelay();
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
    html = await transitData.passedPassStation();
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
    html = await transitData.reachedDestination();
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
        { actual: "4", scheduled: null },
        { name: "Wolverhampton Cs", code: null },
        "-4",
        "journey",
        "end"
      )
    );
  });
  test("Arriving", async () => {
    html = await transitData.arriving();
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
        "-1",
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
