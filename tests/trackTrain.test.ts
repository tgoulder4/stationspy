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
  availableRouteCheck,
  journeyNotFound,
  findOrigin,
  findActioning,
  findDestination,
  getRecordObj,
  trackTrainVariables,
} from "../src/trackTrain";

describe("getCurrentState dependencies", () => {
  describe("availableRouteCheck", () => {
    test("availableRoute -> false (cancelled service)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      expect(
        availableRouteCheck($, $(".dep.act").first(), $(".dep.exp").first())
      ).toBeFalsy();
    });
    test("availableRoute -> false (404)", async () => {
      const html = await journeyNotFoundTest();
      const $ = cheerio.load(html);
      expect(
        availableRouteCheck($, $(".dep.act").first(), $(".dep.exp").first())
      ).toBeFalsy();
    });
    test("availableRoute -> true (standard)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      expect(
        availableRouteCheck($, $(".dep.act").first(), $(".dep.exp").first())
      ).toBeTruthy();
    });
  });
  describe("journeyNotFound", () => {
    test("notFoundCheck -> true (404)", async () => {
      const html = await journeyNotFoundTest();
      const $ = cheerio.load(html);
      expect(journeyNotFound($)).toBeTruthy();
    });
    test("notFoundCheck -> false (standard)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      expect(journeyNotFound($)).toBeFalsy();
    });
  });
  describe("getHTML", () => {
    test("getHTML -> truthy (any service ID)", async () => {
      expect(getHTML("testServiceID", "2023-01-01")).toBeTruthy();
    });
  });
  describe("getRecordObj", () => {
    test("getRecordObj -> finds .location parent (transit) findOrigin dependent", async () => {
      const html = await departedStoppingStation();
      const $: cheerio.Root = cheerio.load(html);
      const { firstDepAct, firstDepExp } = trackTrainVariables($);
      // console.log($(".actioningRecord").html());
      // console.log(getRecordObj($, $(".dep.act").last()).html());
      expect(
        getRecordObj($, firstDepAct.length ? firstDepAct : firstDepExp).html()
      ).toStrictEqual($(".originRecord").html());
    });
  });
  describe("findOrigin", () => {
    test("findOrigin -> departed (transit)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = trackTrainVariables($);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findOrigin($, firstDepAct, firstDepExp).length).toBe(1);
      expect(findOrigin($, firstDepAct, firstDepExp).html()).toStrictEqual(
        $(".originRecord").html()
      );
    });
    test("findOrigin -> non-existent (cancelled)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = trackTrainVariables($);
      // console.log("findOrigin -> non-existent (cancelled):");
      // console.log(findOrigin($).html());
      expect(findOrigin($, firstDepAct, firstDepExp).length).toBe(0);
    });
    test("findOrigin -> (not departed)", async () => {
      const html = await notYetDeparted();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = trackTrainVariables($);
      // console.log("findOrigin -> (not departed):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findOrigin($, firstDepAct, firstDepExp).length).toBe(1);
      expect(findOrigin($, firstDepAct, firstDepExp).html()).toStrictEqual(
        $(".originRecord").html()
      );
    });
  });
  describe("findActioningRecord", () => {
    test("findActioningRecord -> (departedStopping)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { locationList } = trackTrainVariables($);
      // console.log("findOrigin -> departed (transit):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findActioning($, locationList)?.length).toBe(1);
      expect(findActioning($, locationList)?.html()).toStrictEqual(
        $(".actioningRecord").html()
      );
    });
    test("findActioningRecord -> null (not departed)", async () => {
      const html = await notYetDeparted();
      const $ = cheerio.load(html);
      const { locationList } = trackTrainVariables($);
      // console.log("findOrigin -> non-existent (cancelled):");
      // console.log(findOrigin($).html());
      expect(findActioning($, locationList)?.length).toBeUndefined();
      expect(findActioning($, locationList)).toBeNull();
    });
    test("findActioningRecord -> (passedPass)", async () => {
      const html = await passedPassStation();
      const $ = cheerio.load(html);
      const { locationList } = trackTrainVariables($);
      // console.log("findOrigin -> (not departed):");
      // console.log(findOrigin($).html());
      // console.log($(".originRecord").html());
      expect(findActioning($, locationList)?.length).toBe(1);
      expect(findActioning($, locationList)?.html()).toStrictEqual(
        $(".actioningRecord").html()
      );
    });
  });
});
