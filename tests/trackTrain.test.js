const trackTrain = require("../src/trackTrain");
const { expect, describe, it, test } = require("@jest/globals");
const { transitData, erronousData } = require("./testData/testData");
const cheerio = require("cheerio");
let html,
  $ = "";

// test("returns html", expect(trackTrain.getHTML("")).toBeTruthy());
describe("Erronous", () => {
  test("not found", async () => {
    html = await erronousData.journeyNotFound();
    $ = cheerio.load(html);
    const state = await trackTrain.getCurrentState($);
    expect(state).toStrictEqual({
      body: {
        error: "Journey doesn't exist.",
      },
      hidden: {
        update_type: "error",
        action: "end",
      },
    });
    test("service cancelled", async () => {});
  });
});
describe("Normal", () => {
  test("ActArr value for left stopping station", async () => {
    html = await transitData.leftPickupStation();
    $ = cheerio.load(html);
    expect($(".arr.act")).toBeTruthy();
  });
});
