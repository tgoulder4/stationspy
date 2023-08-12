import { parseStationNameAndCode } from "../src/getInfo";
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
describe("getCurrentState dependent fns", () => {
  test("getRecordObj -> length>0 (cancelled service)", async () => {
    const html = await serviceCancelled();
    const $ = cheerio.load(html);
    expect(
      parseStationNameAndCode($, $(".dep.act").first(), $(".dep.exp").first())
    ).toBeFalsy();
  });
});
