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
  getRecordObj,
  getActioningRecord,
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
  describe("notFoundCheck", () => {
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
});
