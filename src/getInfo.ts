import { recordInfo, Location } from "./types/types";
var stationLocations = require("./map/stationLocations.json");
//UNIT TESTS
export function getDelay(record: cheerio.Cheerio) {
  if (record.find(".delay.nil").length != 0) {
    return 0;
  }
  if (record.find(".delay.rt").length != 0) {
    return parseInt(record.find(".delay").text());
  }
  return 0;
}
export function parseStationNameAndCode(stationString: string) {
  if (!stationString) {
    throw new Error("stationString was null");
  }
  const match: RegExpMatchArray | null = stationString.match(
    /^(.+?)(?:\s\[(\w+)\])?$/
  );
  if (match) {
    const name = match[1].split(/\s{2,}/).join(" ");
    return {
      name: name,
      code: match[2] || null,
    };
  }
  return {
    name: "",
    code: null,
  };
}
export function getLocationObject(code: string | null) {
  if (stationLocations[code]) {
    return {
      latitude: stationLocations[code].latitude,
      longitude: stationLocations[code].longitude,
    };
  }
  return null;
}
export function getInfo(record: cheerio.Cheerio): recordInfo {
  const { name, code } = parseStationNameAndCode(
    record
      .find(".name")
      .clone() //clone the element
      .children() //select all the children
      .remove() //remove all the children
      .end() //again go back to selected element
      .text()
      .trim()
  );
  console.log(`code: ${code}`);
  const arrExpValue = record.find(".arr.exp");
  const arrActValue = record.find(".arr.act");
  const depExpValue = record.find(".dep.exp");
  const depActValue = record.find(".dep.act");
  const arrValueExists = arrExpValue.length != 0 || arrActValue.length != 0;
  const depValueExists = depExpValue.length != 0 || depActValue.length != 0;
  const location = getLocationObject(code);

  let platform;
  if (record.find(".platform").text().length != 0) {
    platform = record.find(".platform").text();
  } else {
    platform = null;
  }
  const delay = getDelay(record);
  const stopsHere = record.find(".pass").length == 0;
  let commonBodyData: recordInfo["body"] = {
    name: name,
    code: code,
    location: location,
    platform: platform,
    stopsHere: stopsHere,
    delay: delay,
  };
  //if no dep values
  if (arrValueExists && depValueExists) {
    commonBodyData = {
      ...commonBodyData,
      arrival: {
        actual: arrActValue.length ? arrActValue.text().trim() : null,
        scheduled: arrExpValue.length
          ? arrExpValue.text().trim()
          : record.find(".wtt .arr").text().trim(),
      },
      departure: {
        actual: depActValue.length ? depActValue.text().trim() : null,
        scheduled: depExpValue.length
          ? depExpValue.text().trim()
          : record.find(".wtt .dep").text().trim(),
      },
    };
  }
  if (!arrValueExists && depValueExists) {
    //return without departure
    commonBodyData = {
      ...commonBodyData,
      arrival: {
        actual: null,
        scheduled: null,
      },
      departure: {
        actual: depActValue.length ? depActValue.text().trim() : null,
        scheduled: depExpValue.length
          ? depExpValue.text().trim()
          : record.find(".wtt .dep").text().trim(),
      },
    };
  }
  if (arrValueExists && !depValueExists) {
    commonBodyData = {
      ...commonBodyData,
      arrival: {
        actual: arrActValue.length ? arrActValue.text().trim() : null,
        scheduled: arrExpValue.length
          ? arrExpValue.text().trim()
          : record.find(".wtt .arr").text().trim(),
      },
      departure: {
        actual: null,
        scheduled: null,
      },
    };
  }
  if (!arrValueExists && !depValueExists) {
    commonBodyData = {
      ...commonBodyData,
      arrival: {
        actual: null,
        scheduled: null,
      },
      departure: {
        actual: null,
        scheduled: null,
      },
    };
  }
  let hiddenData: recordInfo["hidden"];
  if (record.find(".platint").length) {
    hiddenData = {
      badgeText: record.find(".platint").text(),
    };
  } else {
    hiddenData = {
      badgeText: "",
    };
  }
  return { body: commonBodyData, hidden: hiddenData };
}
