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
  getCallingPoints,
} from "../src/trackTrain";
import { getInfo, parseStationNameAndCode } from "../src/getInfo";
import { log } from "console";
const util = require("util");
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
      // console.dir($(".actioningRecord").html());
      // console.dir(getRecordObj($, $(".dep.act").last()).html());
      expect(getRecordObj(firstDepAct)?.html()).toStrictEqual(
        $(".originRecord").html()
      );
    });
    test("getRecordObj -> exists (approachingPass)", async () => {
      const html = await approachingAPass();
      const $ = cheerio.load(html);
      // console.dir($(".actioningRecord").html());
      // console.dir(getRecordObj($, $(".dep.act").last()).html());
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
      // console.dir("findOrigin -> departed (transit):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
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
      // console.dir("findOrigin -> (not departed):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
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
      // console.dir("findOrigin -> departed (transit):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
      expect(destinationReached(lastActioned, destination)).toBeFalsy();
    });
  });
  describe("destination", () => {
    test("destination -> isCorrect (partiallyCancelled)", async () => {
      const html = await partiallyCancelled();
      const $ = cheerio.load(html);
      const { destination } = variables($);
      // console.dir("findOrigin -> departed (transit):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
      // expect(destination!.length).toBe(1);
      // expect(destination!.html()).toStrictEqual($(".destinationRecord").html());
    });
    test("destination -> !exists (cancelled)", async () => {
      const html = await serviceCancelled();
      const $ = cheerio.load(html);
      const { destination } = variables($);
      // console.dir("findOrigin -> non-existent (cancelled):");
      // console.dir(findOrigin($).html());
      expect(destination).toBeNull();
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
  });
  describe("findAction", () => {
    test("findAction -> (departedStopping)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.dir("findOrigin -> departed (transit):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
      expect(findAction(locationList)!.length).toBe(1);
    });
    test("findAction -> !exists (not departed)", async () => {
      const html = await notYetDeparted();
      const $ = cheerio.load(html);
      const { locationList } = variables($);
      // console.dir("findOrigin -> non-existent (cancelled):");
      // console.dir(findOrigin($).html());
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
      // console.dir("findOrigin -> (not departed):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
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
      // console.dir("findOrigin -> (not departed):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
      expect(findAction(locationList)!.length).toBe(1);
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
    test("parseStationNameAndCode -> ('Erronous manchester')", async () => {
      expect(
        parseStationNameAndCode("Manchester               Piccadilly")
      ).toStrictEqual({
        name: "Manchester Piccadilly",
        code: null,
      });
    });
  });
  describe("getInfo - parseStationNameAndCode dependent", () => {
    test("getInfo -> (passedPass)", async () => {
      const html = await passedPassStation();
      const $ = cheerio.load(html);
      // console.dir("findOrigin -> departed (transit):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
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
      // console.dir("findOrigin -> departed (transit):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
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
      // console.dir("findOrigin -> departed (transit):");
      // console.dir(findOrigin($).html());
      // console.dir($(".originRecord").html());
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
  describe("getCallingPoints - standard, parse dependent", () => {
    test("getCallingPoints -> isCorrect (departedStopping)", async () => {
      const html = await departedStoppingStation();
      const $ = cheerio.load(html);
      const { lastActioned, destination } = variables($);
      // console.log(
      //   util.inspect(getCallingPoints($, lastActioned, destination), {
      //     showHidden: false,
      //     depth: null,
      //     colors: true,
      //   })
      // );
      expect(getCallingPoints($, lastActioned, destination)).toStrictEqual([
        {
          name: "Birmingham Moor Street",
          code: "[BMO]",
          platform: "2",
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1555" },
          departure: { actual: null, scheduled: "1557" },
        },
        {
          name: "Birmingham Snow Hill",
          code: "[BSW]",
          platform: "1",
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1559" },
          departure: { actual: null, scheduled: "1601" },
        },
        {
          name: "Jewellery Quarter",
          code: "[JEQ]",
          platform: "1",
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1603" },
          departure: { actual: null, scheduled: "1604" },
        },
        {
          name: "The Hawthorns",
          code: "[THW]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1607" },
          departure: { actual: null, scheduled: "1608" },
        },
        {
          name: "Smethwick Galton Bridge",
          code: "[SGB]",
          platform: "1",
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1610" },
          departure: { actual: null, scheduled: "1611" },
        },
        {
          name: "Langley Green",
          code: "[LGG]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1613" },
          departure: { actual: null, scheduled: "1614" },
        },
        {
          name: "Rowley Regis",
          code: "[ROW]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1617" },
          departure: { actual: null, scheduled: "1617" },
        },
        {
          name: "Old Hill",
          code: "[OHL]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1620" },
          departure: { actual: null, scheduled: "1620" },
        },
        {
          name: "Cradley Heath",
          code: "[CRA]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1623" },
          departure: { actual: null, scheduled: "1624" },
        },
        {
          name: "Lye",
          code: "[LYE]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1626" },
          departure: { actual: null, scheduled: "1627" },
        },
        {
          name: "Stourbridge Junction",
          code: "[SBJ]",
          platform: "3",
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1630" },
          departure: { actual: null, scheduled: "1631" },
        },
        {
          name: "Hagley",
          code: "[HAG]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1634" },
          departure: { actual: null, scheduled: "1635" },
        },
        {
          name: "Kidderminster",
          code: "[KID]",
          platform: "2",
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1640" },
          departure: { actual: null, scheduled: "1641" },
        },
        {
          name: "Hartlebury",
          code: "[HBY]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1646" },
          departure: { actual: null, scheduled: "1646" },
        },
        {
          name: "Droitwich Spa",
          code: "[DTW]",
          platform: null,
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1653" },
          departure: { actual: null, scheduled: "1655" },
        },
        {
          name: "Worcester Foregate Street",
          code: "[WOF]",
          platform: "2",
          stopsHere: true,
          delay: 0,
          arrival: { actual: null, scheduled: "1704" },
          departure: { actual: null, scheduled: null },
        },
      ]);
    });
    test("getCallingPoints -> null (ReachedDestination)", async () => {
      const html = await reachedDestination();
      const $ = cheerio.load(html);
      const { lastActioned, destination } = variables($);
      expect(getCallingPoints($, lastActioned, destination)).toBeNull();
    });
  });
});
// describe("getCurrentState - all dependent", () => {
//   test("getCurrentState -> (passedPass)", async () => {
//     const html = await passedPassStation();
//     const $ = cheerio.load(html);
//     // expect(getCurrentState($)).toStrictEqual({
//     //   body: {
//     //     status: "Passed",
//     //     station: {
//     //       name: "Proof House Jn",
//     //       code: "[XOZ]",
//     //       platform: null,
//     //       stopsHere: false,
//     //       delay: 1,
//     //       arrival: {
//     //         actual: null,
//     //         scheduled: null,
//     //       },
//     //       departure: {
//     //         actual: "2236¾",
//     //         scheduled: "2235½",
//     //       },
//     //     },
//     //     destination: {
//     //       name: "Wolverhampton Cs",
//     //       code: null,
//     //       arrival: {
//     //         actual: null,
//     //         scheduled: "2313",
//     //       },
//     //     },
//     //   },
//     //   hidden: {
//     //     update_type: "journey",
//     //     action: "continue",
//     //   },
//     // });
//   });
//   test("getCurrentState -> (destinationReached)", async () => {
//     const html = await reachedDestination();
//     const $ = cheerio.load(html);
//     expect(getCurrentState($)).toStrictEqual({
//       body: {
//         status: "Reached destination",
//         station: {
//           name: "Wolverhampton Cs",
//           code: null,
//           platform: "4",
//           stopsHere: true,
//           delay: -4,
//           arrival: {
//             actual: "2309",
//             scheduled: "2313",
//           },
//           departure: {
//             actual: null,
//             scheduled: null,
//           },
//         },
//         callingPoints: null,
//       },
//       hidden: {
//         update_type: "journey",
//         action: "end",
//       },
//     });
//   });
//   test("getCurrentState -> (arriving)", async () => {
//     const html = await arriving();
//     const $ = cheerio.load(html);
//     expect(getCurrentState($)).toStrictEqual({
//       body: {
//         status: "Arriving",
//         station: {
//           name: "Birmingham Moor Street",
//           code: "[BMO]",
//           platform: "2",
//           stopsHere: true,
//           delay: 0,
//           arrival: { actual: "1555", scheduled: "1555½" },
//           departure: { actual: null, scheduled: "1557" },
//         },
//         callingPoints: [
//           {
//             name: "Birmingham Snow Hill",
//             code: "[BSW]",
//             platform: "1",
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1559" },
//             departure: { actual: null, scheduled: "1601" },
//           },
//           {
//             name: "Jewellery Quarter",
//             code: "[JEQ]",
//             platform: "1",
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1603" },
//             departure: { actual: null, scheduled: "1604" },
//           },
//           {
//             name: "The Hawthorns",
//             code: "[THW]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1607" },
//             departure: { actual: null, scheduled: "1608" },
//           },
//           {
//             name: "Smethwick Galton Bridge",
//             code: "[SGB]",
//             platform: "1",
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1610" },
//             departure: { actual: null, scheduled: "1611" },
//           },
//           {
//             name: "Langley Green",
//             code: "[LGG]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1613" },
//             departure: { actual: null, scheduled: "1614" },
//           },
//           {
//             name: "Rowley Regis",
//             code: "[ROW]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1617" },
//             departure: { actual: null, scheduled: "1617" },
//           },
//           {
//             name: "Old Hill",
//             code: "[OHL]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1620" },
//             departure: { actual: null, scheduled: "1620" },
//           },
//           {
//             name: "Cradley Heath",
//             code: "[CRA]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1623" },
//             departure: { actual: null, scheduled: "1624" },
//           },
//           {
//             name: "Lye",
//             code: "[LYE]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1626" },
//             departure: { actual: null, scheduled: "1627" },
//           },
//           {
//             name: "Stourbridge Junction",
//             code: "[SBJ]",
//             platform: "3",
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1630" },
//             departure: { actual: null, scheduled: "1631" },
//           },
//           {
//             name: "Hagley",
//             code: "[HAG]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1634" },
//             departure: { actual: null, scheduled: "1635" },
//           },
//           {
//             name: "Kidderminster",
//             code: "[KID]",
//             platform: "2",
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1640" },
//             departure: { actual: null, scheduled: "1641" },
//           },
//           {
//             name: "Hartlebury",
//             code: "[HBY]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1646" },
//             departure: { actual: null, scheduled: "1646" },
//           },
//           {
//             name: "Droitwich Spa",
//             code: "[DTW]",
//             platform: null,
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1653" },
//             departure: { actual: null, scheduled: "1655" },
//           },
//           {
//             name: "Worcester Foregate Street",
//             code: "[WOF]",
//             platform: "2",
//             stopsHere: true,
//             delay: 0,
//             arrival: { actual: null, scheduled: "1704" },
//             departure: { actual: null, scheduled: null },
//           },
//         ],
//       },
//       hidden: { update_type: "journey", action: "continue" },
//     });
//   });
// });
