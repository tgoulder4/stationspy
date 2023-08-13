import { recordInfo } from "./types/types";
//UNIT TESTS
export function getDelay(record: cheerio.Cheerio) {
  if (record.find(".delay.nil").length != 0) {
    return 0;
  }
  return parseInt(record.find(".delay").text());
}
export function parseStationNameAndCode(record: cheerio.Cheerio) {
  const match: RegExpMatchArray | null = record
    .find(".name")
    .text()
    .match(/^(.+?)(?:\s(\[\w+\]))?$/);
  //regex is correct
  if (!match) {
    throw new Error("Match was null");
  }
  return {
    name: match[1].trimEnd(),
    code: match[2],
  };
}
export function getInfo(record: cheerio.Cheerio): recordInfo {
  const { name, code } = parseStationNameAndCode(record);
  const arrExpValue = record.find(".arr.exp");
  const arrActValue = record.find(".arr.act");
  const depExpValue = record.find(".dep.exp");
  const depActValue = record.find(".dep.act");
  const arrValueExists = arrExpValue.length != 0 || arrActValue.length != 0;
  const depValueExists = depExpValue.length != 0 || depActValue.length != 0;
  console.log(`arrActValueExists: ${arrValueExists}`);
  console.log(`depValueExists: ${depValueExists}`);
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
          ? arrExpValue.text()
          : record.find(".wtt .arr").text(),
      },
      departure: {
        actual: depActValue ? depActValue.text().trim() : null,
        scheduled: depExpValue.length
          ? depExpValue.text()
          : record.find(".wtt .dep").text(),
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
        actual: depActValue ? depActValue.text().trim() : null,
        scheduled: depExpValue.length
          ? depExpValue.text()
          : record.find(".wtt .dep").text().trim(),
      },
    };
  }
  if (arrValueExists && !depValueExists) {
    commonBodyData = {
      ...commonBodyData,
      arrival: {
        actual: arrActValue.text(),
        scheduled: arrExpValue.length
          ? arrExpValue.text()
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
