const { getCurrentState, getHTML } = require("../src/trackTrain");
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
  test("ActArr value for left stopping station", async () => {
    html = await transitData.leftPickupStation();
    $ = cheerio.load(html);
    expect(await getCurrentState($)).toStrictEqual({
      body: {
        status: "Departed",
        station: {
          name: "Small Heath",
          code: "SMA",
          arrival: { actual: "1549¾" },
          departure: { actual: "1552" },
          stopsHere: true,
        },
        destination: "Worcester Foregate Street",
        delay: "-1",
      },
      hidden: { action: "continue", update_type: "journey" },
    });
  });
});
