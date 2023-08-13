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
} from "../src/trackTrain";
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
});
