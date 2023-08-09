const trackTrain = require("../src/trackTrain");
const { expect, describe, it, test } = require("@jest/globals");
const EventEmitter = require("events");
const { transitData } = require("../tests/testData/testhtml.js");
const cheerio = require("cheerio");
// test("returns html", expect(trackTrain.getHTML("")).toBeTruthy());

test("not found", async () => {
  let response = await fetch(
    "https://www.realtimetrains.co.uk/service/gb-nr:fhdhfhe/2023-08-08/detailed#allox_id=0"
  );
  let html = await response.text();
  let $ = cheerio.load(html);
  expect(trackTrain.getCurrentState($).then((data) => data)).toBe({
    update_type: "error",
    details: "Journey doesn't exist",
    action: "end",
  });
  $ = cheerio.load(transitData.leftPickupStation);
  expect($(".arr.act")).toBeTruthy();
});

// test("emit body", () => {
//   const emitter = new EventEmitter();
//   expect(() => {
//     trackTrain.emitUpdate(emitter, {
//       body: {
//         status: "",
//         station: "",
//         departure: { scheduled: "", actual: "" },
//         arrival: { scheduled: "", actual: "1549¾" },
//         nextStation: "",
//         delay: "",
//       },
//       hidden: {
//         update_type: "journey",
//         action: "continue",
//       },
//     });
//     //subscribe
//     emitter.on("notificationUpdate", (data) => data());
//   }).toBe({
//     status: "",
//     station: "",
//     departure: { scheduled: "", actual: "" },
//     arrival: { scheduled: "", actual: "" },
//     nextStation: "",
//     delay: "",
//   });
// });
