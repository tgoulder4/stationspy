const trackTrain = require("../src/trackTrain");
const { expect, describe, it, test } = require("@jest/globals");
const EventEmitter = require("events");
// const {
//   departureData,
//   transitData,
//   endJourneyData,
// } = require("../tests/testData/testhtml.js");
const { cheerio } = require("cheerio");
// test("returns html", expect(trackTrain.getHTML("")).toBeTruthy());

test("404 journey not found", async () => {
  let html = "";
  let $ = "";
  let response = "";
  response = await fetch(
    "https://www.realtimetrains.co.uk/service/gb-nr:fhdhfhe/2023-08-08/detailed#allox_id=0"
  );
  html = await response.text();
  $ = cheerio.load(html);
  expect(trackTrain.getCurrentState($)).toBe({
    update_type: "error",
    details: "Journey doesn't exist",
    action: "end",
  });
});
test("emit body", () => {
  const emitter = new EventEmitter();
  expect(() => {
    trackTrain.emitUpdate(emitter, {
      body: {
        status: "",
        station: "",
        departure: { scheduled: "", actual: "" },
        arrival: { scheduled: "", actual: "" },
        nextStation: "",
        delay: "",
      },
      hidden: {
        update_type: "notification",
        action: "continue",
      },
    });
    //subscribe
    emitter.on("notificationUpdate", (data) => data());
  }).toBe({
    status: "",
    station: "",
    departure: { scheduled: "", actual: "" },
    arrival: { scheduled: "", actual: "" },
    nextStation: "",
    delay: "",
  });
});
