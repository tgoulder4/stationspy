const {
  getCurrentState,
  getHTML,
  getStationNameAndCode,
  stateObject,
} = require("../src/trackTrain");
const { expect, describe, it, test } = require("@jest/globals");
const { transitData, erronousData } = require("./testData/testData");
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
    const state = await getCurrentState($);
    expect(state).toStrictEqual({
      body: {
        error: "Not found",
      },
      hidden: {
        update_type: "error",
        action: "end",
      },
    });
  });
  test("service cancelled", async () => {});
});
describe("Normal", () => {
  test("Departed status on stopping station", async () => {
    html = await transitData.leftPickupStation();
    $ = cheerio.load(html);
    expect(await getCurrentState($)).toStrictEqual(
      stateObject(
        "Departed",
        {
          name: "Small Heath",
          code: "[SMA]",
          arrival: { actual: "1549¾" },
          departure: { actual: "1552" },
          stopsHere: true,
        },
        { name: "Worcester Foregate Street", code: "[WOF]" },
        "-1",
        "journey",
        "continue"
      )
    );
  });
  test("Passed status on non-stopping station", async () => {
    html = await transitData.passedPassStation();
    $ = cheerio.load(html);
    expect(await getCurrentState($)).toStrictEqual(
      stateObject(
        "Passed",
        {
          name: "Proof House Jn",
          code: "[XOZ]",
          arrival: { actual: null },
          departure: { actual: "2236¾" },
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
    expect(await getCurrentState($)).toStrictEqual(
      stateObject(
        "Reached destination",
        {
          name: "Wolverhampton Cs",
          code: null,
          arrival: { actual: "2309" },
          departure: { actual: null },
          stopsHere: true,
        },
        { name: "Wolverhampton Cs", code: null },
        "-4",
        "journey",
        "end"
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
