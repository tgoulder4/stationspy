import { expect, describe, test } from "@jest/globals";
import cheerio from "cheerio";
//-----------------MOCKS-----------------
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
} from "./testHTMLData";
import {
  getHTML,
  findAction,
  getRecordObj,
  variables,
  locationListExists,
  destinationReached,
  getCurrentState,
} from "../src/trackTrain";
import { getInfo, parseStationNameAndCode } from "../src/getInfo";
//  && lastActioned.find(".pass").length!=0
describe("primitives: getCurrentState", () => {
  describe("locationListExists", () => {
    test("locationListExists -> false (404)", async () => {
      const html = await journeyNotFoundTest();
      const $ = cheerio.load(html);
      expect(locationListExists($)).toBeFalsy();
    });
    test("locationListExists -> true (standard)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      expect(locationListExists($)).toBeTruthy();
    });
  });
  describe("originIsNull", () => {
    test("originIsNull -> true (404)", async () => {
      const html = await journeyNotFoundTest();
      const $ = cheerio.load(html);
      const { origin } = variables($);
      expect(!origin).toBeTruthy();
    });
    test("originIsNull -> true (cancelled)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      const { origin } = variables($);
      expect(!origin).toBeTruthy();
    });
    test("originIsNull -> false (standard)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { origin } = variables($);
      expect(!origin).toBeFalsy();
    });
  });
  describe("getHTML", () => {
    test("getHTML -> exists (any service ID)", async () => {
      expect(await getHTML("testServiceID", "2023-01-01")).toBeTruthy();
    });
  });
  describe("getRecordObj", () => {
    test("getRecordObj -> exists (departed)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { firstDepAct } = variables($);
      // console.log($(".actioningRecord").html());
      // console.log(getRecordObj($, $(".dep.act").last()).html());
      expect(getRecordObj(firstDepAct)?.html()).toStrictEqual(
        $(".originRecord").html()
      );
    });
    test("getRecordObj -> exists (approachingPass)", async () => {
      const html = await approachingAPass();
      const $ = cheerio.load(html);
      // console.log($(".actioningRecord").html());
      // console.log(getRecordObj($, $(".dep.act").last()).html());
      expect(getRecordObj($(".platint"))?.html()).toStrictEqual(
        $(".actioningRecord").html()
      );
    });
  });
  describe("findOrigin", () => {
    test("findOrigin -> isCorrect (departed)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = variables($);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
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
      // console.log("findOrigin -> non-existent (cancelled):");
      // console.log(findOrigin($).html());
      expect(
        getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.length
      ).toBe(0);
    });
    test("findOrigin -> isCorrect (not departed)", async () => {
      const html = await notYetDeparted();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = variables($);
      // console.log("findOrigin -> (not departed):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(
        getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.length
      ).toBe(1);
      expect(
        getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.html()
      ).toStrictEqual($(".originRecord").html());
    });
  });
  describe("destinationReached", () => {
    test("destinationReached -> true (ReachedDestination)", async () => {
      const html = await reachedDestination();
      const $ = cheerio.load(html);
      const { destination, lastActioned } = variables($);
      expect(destinationReached(lastActioned, destination)).toBeTruthy();
    });
    test("destinationReached -> false (cancelled)", async () => {
      const html = await notYetDeparted();
      const $ = cheerio.load(html);
      const { destination, lastActioned } = variables($);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(destinationReached(lastActioned, destination)).toBeFalsy();
    });
  });
  describe("destination", () => {
    test("destination -> isCorrect (partiallyCancelled)", async () => {
      const html = await partiallyCancelled();
      const $ = cheerio.load(html);
      const { destination } = variables($);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(destination!.length).toBe(1);
      expect(destination!.html()).toStrictEqual($(".destinationRecord").html());
    });
    test("destination -> !exists (cancelled)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      const { destination } = variables($);
      // console.log("findOrigin -> non-existent (cancelled):");
      // console.log(findOrigin($).html());
      expect(destination).toBeNull();
    });
    test("destination -> isCorrect (departedStopping)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { destination } = variables($);
      // console.log(`lastArrExp: ${lastArrExp}`);
      // console.log(`destination: ${destination}`);
      expect(destination!.length).toBe(1);
      expect(destination!.html()).toStrictEqual($(".destinationRecord").html());
    });
  });
  describe("findAction", () => {
    test("findAction -> (departedStopping)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findAction(locationList)!.length).toBe(1);
      expect(findAction(locationList)!.text().trim()).toBe("1552");
    });
    test("findAction -> !exists (not departed)", async () => {
      const html = await notYetDeparted();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.log("findOrigin -> non-existent (cancelled):");
      // console.log(findOrigin($).html());
      expect(findAction(locationList)).toBeNull();
    });
    test("findAction -> exists depNonPass (passedPass)", async () => {
      const html = await passedPassStation();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      expect(findAction(locationList)!.length).toBe(1);
      expect(findAction(locationList)!.text().trim()).toBe("2236¾");
    });
    test("findAction -> exists arriving (arrivingStop)", async () => {
      const html = await arriving();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.log("findOrigin -> (not departed):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findAction(locationList)!.length).toBe(1);
      expect(findAction(locationList)!.text().trim()).toBe("Arriving");
    });
    test("findAction -> exists reachedDestination (reachedDestination)", async () => {
      const html = await reachedDestination();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      expect(findAction(locationList)!.length).toBe(1);
      expect(findAction(locationList)!.text().trim()).toBe("2309");
    });
    test("findAction -> exists approaching (approachingPass)", async () => {
      const html = await approachingAPass();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.log("findOrigin -> (not departed):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findAction(locationList)!.length).toBe(1);
      expect(findAction(locationList)!.text().trim()).toBe("Approaching");
    });
  });

  describe("parseStationNameAndCode", () => {
    test("parseStationNameAndCode -> ('Birmingham Moor Street [BMO]')", async () => {
      expect(
        parseStationNameAndCode("Birmingham Moor Street [BMO]")
      ).toStrictEqual({
        name: "Birmingham Moor Street",
        code: "[BMO]",
      });
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
        code: "[test]",
      });
    });
  });
  describe("getInfo - parseStationNameAndCode dependent", () => {
    test("getInfo -> (passedPass)", async () => {
      const html = await passedPassStation();
      const $ = cheerio.load(html);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getInfo($(".actioningRecord"))).toStrictEqual({
        body: {
          name: "Proof House Jn",
          code: "[XOZ]",
          arrival: { actual: null, scheduled: null },
          platform: null,
          delay: 1,
          departure: { actual: "2236¾", scheduled: "2235½" },
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
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getInfo($(".actioningRecord"))).toStrictEqual({
        body: {
          name: "Birmingham Moor Street",
          code: "[BMO]",
          arrival: { actual: "1555", scheduled: "1555½" },
          platform: "2",
          delay: 0,
          departure: { actual: null, scheduled: "1557" },
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
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getInfo($(".actioningRecord"))).toStrictEqual({
        body: {
          name: "Small Heath",
          code: "[SMA]",
          arrival: { actual: "1549¾", scheduled: "1551" },
          platform: "4",
          delay: 0,
          departure: { actual: "1552", scheduled: "1552" },
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
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getInfo($(".destinationRecord"))).toStrictEqual({
        body: {
          name: "Wolverhampton Cs",
          code: null,
          arrival: { actual: "2309", scheduled: "2313" },
          platform: "4",
          delay: -4,
          departure: { actual: null, scheduled: null },
          stopsHere: true,
        },
        hidden: {
          badgeText: "",
        },
      });
    });
  });
  describe("getCurrentState - all dependent", () => {
    test("getCurrentState -> (passedPass)", async () => {
      const html = await passedPassStation();
      const $ = cheerio.load(html);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getCurrentState($)).toStrictEqual({
        body: {
          status: "Passed",
          station: {
            name: "Proof House Jn",
            code: "[XOZ]",
            platform: null,
            stopsHere: false,
            delay: 1,
            arrival: {
              actual: null,
              scheduled: null,
            },
            departure: {
              actual: "2236¾",
              scheduled: "2235½",
            },
          },
          destination: {
            name: "Wolverhampton Cs",
            code: null,
            arrival: {
              actual: null,
              scheduled: "2313",
            },
          },
        },
        hidden: {
          update_type: "journey",
          action: "continue",
        },
      });
    });
    test("getInfo -> (arriving)", async () => {
      const html = await arriving();
      const $ = cheerio.load(html);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getInfo($(".actioningRecord"))).toStrictEqual({
        body: {
          name: "Birmingham Moor Street",
          code: "[BMO]",
          arrival: { actual: "1555", scheduled: "1555½" },
          platform: "2",
          delay: 0,
          departure: { actual: null, scheduled: "1557" },
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
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getInfo($(".actioningRecord"))).toStrictEqual({
        body: {
          name: "Small Heath",
          code: "[SMA]",
          arrival: { actual: "1549¾", scheduled: "1551" },
          platform: "4",
          delay: 0,
          departure: { actual: "1552", scheduled: "1552" },
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
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(getInfo($(".destinationRecord"))).toStrictEqual({
        body: {
          name: "Wolverhampton Cs",
          code: null,
          arrival: { actual: "2309", scheduled: "2313" },
          platform: "4",
          delay: -4,
          departure: { actual: null, scheduled: null },
          stopsHere: true,
        },
        hidden: {
          badgeText: "",
        },
      });
    });
  });
});
