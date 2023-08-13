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
} from "./testHTMLData";
import {
  getHTML,
  findAction,
  getRecordObj,
  variables,
  locationListExists,
  originIsNull,
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
      expect(originIsNull(origin)).toBeTruthy();
    });
    test("originIsNull -> true (cancelled)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      const { origin } = variables($);
      expect(originIsNull(origin)).toBeTruthy();
    });
    test("originIsNull -> false (standard)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { origin } = variables($);
      expect(originIsNull(origin)).toBeFalsy();
    });
  });
  describe("getHTML", () => {
    test("getHTML -> truthy (any service ID)", async () => {
      expect(await getHTML("testServiceID", "2023-01-01")).toBeTruthy();
    });
  });
  describe("getRecordObj", () => {
    test("getRecordObj -> exists", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { firstDepAct } = variables($);
      // console.log($(".actioningRecord").html());
      // console.log(getRecordObj($, $(".dep.act").last()).html());
      expect(getRecordObj(firstDepAct)?.html()).toStrictEqual(
        $(".originRecord").html()
      );
    });
  });
  describe("findOrigin", () => {
    test("findOrigin -> departed (transit)", async () => {
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
    test("findOrigin -> non-existent (cancelled)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = variables($);
      // console.log("findOrigin -> non-existent (cancelled):");
      // console.log(findOrigin($).html());
      expect(
        getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp)?.length
      ).toBe(0);
    });
    test("findOrigin -> exists (not departed)", async () => {
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
  describe("findAction", () => {
    test("findAction -> (departedStopping)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findAction(locationList)?.length).toBe(1);
      expect(findAction(locationList)?.text().trim()).toBe("1552");
    });
    test("findAction -> null (not departed)", async () => {
      const html = await notYetDeparted();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.log("findOrigin -> non-existent (cancelled):");
      // console.log(findOrigin($).html());
      expect(findAction(locationList)).toBeNull();
    });
    test("findAction -> (passedPass)", async () => {
      const html = await passedPassStation();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.log("findOrigin -> (not departed):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findAction(locationList)!.length).toBe(1);
      expect(findAction(locationList)!.text().trim()).toBe("2236¾");
    });
  });
});
