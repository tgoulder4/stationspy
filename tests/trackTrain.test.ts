import { expect, test } from "@jest/globals";
import cheerio from "cheerio";
//-----------------MOCKS-----------------
import {
  serviceCancelled,
  departedStoppingStation,
  passedPassStation,
  reachedDestination,
  arriving,
  journeyNotFoundTest,
  notYetDeparted,
  approachingAPass,
  partiallyCancelled,
} from "./testHTMLData";
import {
  getHTML,
  findAction,
  getRecordObj,
  variables,
  locationListExists,
  destinationReached,
} from "../src/trackTrain";
import {
  getInfo,
  getLocationObject,
  parseStationNameAndCode,
} from "../src/getInfo";
const util = require("util");
//-----------------TESTS-----------------

test("locationListExists -> false (404)", () => {
  //HANGING
  return journeyNotFoundTest().then((html) => {
    const $ = cheerio.load(html);
    expect(locationListExists($)).toBeFalsy();
  });
});
test("locationListExists -> true (standard)", () => {
  return departedStoppingStation().then((html) => {
    const $ = cheerio.load(html);
    expect(locationListExists($)).toBeTruthy();
  });
});
test("origin -> null (404)", () => {
  return journeyNotFoundTest().then((html) => {
    const $ = cheerio.load(html);
    const { origin } = variables($);
    expect(origin).toBeNull();
  });
});
test("origin -> null (cancelled)", () => {
  return serviceCancelled().then((html) => {
    const $ = cheerio.load(html);
    const { origin } = variables($);
    expect(origin).toBeNull();
  });
});
test("origin -> null (standard)", () => {
  return departedStoppingStation().then((html) => {
    const $ = cheerio.load(html);
    const { origin } = variables($);
    expect(origin?.html()).toStrictEqual($(".originRecord").html());
  });
});
test("getHTML -> exists (any service ID)", () => {
  return getHTML("testServiceID", "2023-01-01").then((res) => {
    expect(res).toBeTruthy();
  });
});
test("getRecordObj -> exists (departed)", () => {
  return departedStoppingStation().then((html) => {
    const $ = cheerio.load(html);
    const { firstDepAct } = variables($);
    expect(getRecordObj(firstDepAct)?.html()).toStrictEqual(
      $(".originRecord").html()
    );
  });
});
test("getRecordObj -> exists (approachingPass)", () => {
  return approachingAPass().then((html) => {
    const $ = cheerio.load(html);
    expect(getRecordObj($(".platint"))?.html()).toStrictEqual(
      $(".actioningRecord").html()
    );
  });
});
test("destinationReached -> true (ReachedDestination)", () => {
  return reachedDestination().then((html) => {
    const $ = cheerio.load(html);
    const { destination, lastActioned } = variables($);
    expect(destinationReached(lastActioned, destination)).toBeTruthy();
  });
});
test("destinationReached -> false (cancelled)", () => {
  return notYetDeparted().then((html) => {
    const $ = cheerio.load(html);
    const { destination, lastActioned } = variables($);
    expect(destinationReached(lastActioned, destination)).toBeFalsy();
  });
});
test("destination -> isCorrect (partiallyCancelled)", () => {
  return partiallyCancelled().then((html) => {
    const $ = cheerio.load(html);
    const { destination } = variables($);
    expect(destination!.length).toBe(1);
    expect(destination!.html()).toStrictEqual($(".destinationRecord").html());
  });
});
test("destination -> !exists (cancelled)", () => {
  return serviceCancelled().then((html) => {
    const $ = cheerio.load(html);
    const { destination } = variables($);
    expect(destination).toBeNull();
  });
});
test("destination -> isCorrect (departedStopping)", async () => {
  const html = await departedStoppingStation();
  const $ = cheerio.load(html);
  const { destination } = variables($);
  // console.dir(`lastArrExp: ${lastArrExp}`);
  // console.dir(`destination: ${destination}`);
  expect(destination!.length).toBe(1);
  expect(destination!.html()).toStrictEqual($(".destinationRecord").html());
});
test("findAction -> (departedStopping)", async () => {
  const html = await departedStoppingStation();
  const $ = cheerio.load(html);
  const { locationList } = variables($);
  expect(findAction(locationList)!.length).toBe(1);
});
test("findAction -> !exists (not departed)", async () => {
  const html = await notYetDeparted();
  const $ = cheerio.load(html);
  const { locationList } = variables($);
  expect(findAction(locationList)).toBeNull();
});
test("findAction -> exists depNonPass (passedPass)", async () => {
  const html = await passedPassStation();
  const $ = cheerio.load(html);
  const { locationList } = variables($);
  expect(findAction(locationList)!.length).toBe(1);
});
test("findAction -> exists arriving (arrivingStop)", async () => {
  const html = await arriving();
  const $ = cheerio.load(html);
  const { locationList } = variables($);
  expect(findAction(locationList)!.length).toBe(1);
});
test("findAction -> exists reachedDestination (reachedDestination)", async () => {
  const html = await reachedDestination();
  const $ = cheerio.load(html);
  const { locationList } = variables($);
  expect(findAction(locationList)!.length).toBe(1);
});
test("findAction -> exists approaching (approachingPass)", async () => {
  const html = await approachingAPass();
  const $ = cheerio.load(html);
  const { locationList } = variables($);
  expect(findAction(locationList)!.length).toBe(1);
});
test("findOrigin -> isCorrect (departed)", async () => {
  const html = await departedStoppingStation();
  const $ = cheerio.load(html);
  const { firstDepAct, firstDepExp } = variables($);
  expect(
    getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.length
  ).toBe(1);
  expect(
    getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.html()
  ).toStrictEqual($(".originRecord").html());
});
test("findOrigin -> !exists (cancelled)", async () => {
  const html = await serviceCancelled();
  const $ = cheerio.load(html);
  const { firstDepAct, firstDepExp } = variables($);
  // console.dir("findOrigin -> non-existent (cancelled):");
  // console.dir(findOrigin($).html());
  expect(
    getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.length
  ).toBe(0);
});
test("findOrigin -> isCorrect (not departed)", async () => {
  const html = await notYetDeparted();
  const $ = cheerio.load(html);
  const { firstDepAct, firstDepExp } = variables($);
  expect(
    getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.length
  ).toBe(1);
  expect(
    getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.html()
  ).toStrictEqual($(".originRecord").html());
});
test("parseStationNameAndCode -> ('Birmingham Moor Street [BMO]')", async () => {
  expect(parseStationNameAndCode("Birmingham Moor Street [BMO]")).toStrictEqual(
    {
      name: "Birmingham Moor Street",
      code: "BMO",
    }
  );
});
test("parseStationNameAndCode -> ('Wolverhampton Cs')", async () => {
  expect(parseStationNameAndCode("Wolverhampton Cs")).toStrictEqual({
    name: "Wolverhampton Cs",
    code: null,
  });
});
test("parseStationNameAndCode -> ('lastTest [test]')", async () => {
  expect(parseStationNameAndCode("lastTest [test]")).toStrictEqual({
    name: "lastTest",
    code: "test",
  });
});
test("parseStationNameAndCode -> ('Erronous manchester')", async () => {
  expect(
    parseStationNameAndCode("Manchester               Piccadilly")
  ).toStrictEqual({
    name: "Manchester Piccadilly",
    code: null,
  });
});
test("getInfo -> (passedPass)", async () => {
  const html = await passedPassStation();
  const $ = cheerio.load(html);
  // console.dir("findOrigin -> departed (transit):");
  // console.dir(findOrigin($).html());
  // console.dir($(".originRecord").html());
  expect(getInfo($(".actioningRecord"))).toStrictEqual({
    body: {
      name: "Proof House Jn",
      code: "XOZ",
      arrival: { actual: null, scheduled: null },
      platform: null,
      delay: 1,
      departure: { actual: "2236¾", scheduled: "2235½" },
      location: null,
      stopsHere: false,
    },
    hidden: {
      badgeText: "",
    },
  });
});
test("getInfo -> (arriving)", async () => {
  const html = await arriving();
  const $ = cheerio.load(html);
  expect(getInfo($(".actioningRecord"))).toStrictEqual({
    body: {
      name: "Birmingham Moor Street",
      code: "BMO",
      arrival: { actual: "1555", scheduled: "1555½" },
      platform: "2",
      delay: 0,
      departure: { actual: null, scheduled: "1557" },
      location: {
        latitude: 52.4790920668,
        longitude: -1.8924677323,
      },
      stopsHere: true,
    },
    hidden: {
      badgeText: "Arriving",
    },
  });
});
test("getInfo -> (departedStopping)", async () => {
  const html = await departedStoppingStation();
  const $ = cheerio.load(html);
  expect(getInfo($(".actioningRecord"))).toStrictEqual({
    body: {
      name: "Small Heath",
      code: "SMA",
      arrival: { actual: "1549¾", scheduled: "1551" },
      platform: "4",
      delay: 0,
      departure: { actual: "1552", scheduled: "1552" },
      location: {
        latitude: 52.4637743964,
        longitude: -1.8593875424,
      },
      stopsHere: true,
    },
    hidden: {
      badgeText: "",
    },
  });
});
test("getInfo -> nullDep (ReachedDestination)", async () => {
  const html = await reachedDestination();
  const $ = cheerio.load(html);
  expect(getInfo($(".destinationRecord"))).toStrictEqual({
    body: {
      name: "Wolverhampton Cs",
      code: null,
      arrival: { actual: "2309", scheduled: "2313" },
      platform: "4",
      delay: -4,
      departure: { actual: null, scheduled: null },
      location: null,
      stopsHere: true,
    },
    hidden: {
      badgeText: "",
    },
  });
});
test("StationLocation -> isCorrect (departedStopping)", async () => {
  const html = await departedStoppingStation();
  const $ = cheerio.load(html);
  expect(getLocationObject("SMA")).toStrictEqual({
    latitude: 52.4637743964,
    longitude: -1.8593875424,
  });
});
