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
} from "./testHTMLData";
import {
  getHTML,
  availableRouteCheck,
  journeyNotFound,
  findOrigin,
  findActioning,
  findDestination,
  getRecordObj,
  getVariables,
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
      const { firstDepAct, firstDepExp } = getVariables($);
      // console.log($(".actioningRecord").html());
      // console.log(getRecordObj($, $(".dep.act").last()).html());
      expect(
        getRecordObj($, firstDepAct.length ? firstDepAct : firstDepExp).html()
      ).toStrictEqual($(".originRecord").html());
    });
  });
  describe("findOrigin", () => {
    test("findOrigin -> finds existing (transit)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = getVariables($);
      expect(findOrigin($, firstDepAct, firstDepExp).html()).toStrictEqual(
        $(".originRecord").html()
      );
    });
    test("findOrigin -> non-existent (cancelled)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      const { firstDepAct, firstDepExp } = getVariables($);
      expect(firstDepAct.length).toBe(0);
      expect(firstDepExp.length).toBe(0);
      expect(findOrigin($, firstDepAct, firstDepExp).length).toBe(0);
    });
  });
  // describe("findActioningRecord", () => {
  //   test("findActioningRecord -> element equality (transit)", async () => {
  //     const html = await departedStoppingStation();
  //     const $ = cheerio.load(html);
  //     expect(findActioning($, $(".locationlist"))).toBe($(".actioningRecord"));
  //   });
  // });
  // describe("findOrigin", () => {
  //   test("findOrigin -> element equality (transit)", async () => {
  //     const html = await departedStoppingStation();
  //     const $ = cheerio.load(html);
  //     expect(
  //       findOrigin($, $(".dep.act").first(), $(".dep.exp").first())
  //     ).toBe($(".originRecord"));
  //   });
  // });
  // describe("findDestination", () => {
  //   test("findDestination -> is .destRecord (transit)", async () => {
  //     const html = await departedStoppingStation();
  //     const $ = cheerio.load(html);
  //     expect(
  //       findDestination($, $(".arr.act").last(), $(".arr.exp").last()).text()
  //     ).toBe($(".destinationRecord").text());
  //   });
  // });
});
