import { recordInfo } from "./types/types";
function getDelay(record: cheerio.Cheerio) {
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
export default function getInfo(record: cheerio.Cheerio): recordInfo {
  const { name, code } = parseStationNameAndCode(record);
  const arrExpValue = record.find(".arr.exp");
  const arrActValue = record.find(".arr.act");
  const depExpValue = record.find(".dep.exp");
  const depActValue = record.find(".dep.act");
  const arrValueExists = arrExpValue.length != 0 && arrActValue.length != 0;
  const depValueExists = depExpValue.length != 0 && depActValue.length != 0;
  const platform = record.find(".platform").text();
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
        actual: arrActValue.text(),
        scheduled: arrExpValue.length
          ? record.find(".wtt .dep").text()
          : arrExpValue.text(),
      },
      departure: {
        actual: depActValue.text(),
        scheduled: depExpValue.length
          ? record.find(".wtt .dep").text()
          : depExpValue.text(),
      },
    };
  }
  if (!arrValueExists && depValueExists) {
    //return without departure
    commonBodyData = {
      ...commonBodyData,
      departure: {
        actual: depActValue.text(),
        scheduled: depExpValue.length
          ? record.find(".wtt .dep").text()
          : depExpValue.text(),
      },
    };
  }
  if (arrValueExists && !depValueExists) {
    commonBodyData = {
      ...commonBodyData,
      arrival: {
        actual: arrActValue.text(),
        scheduled: arrExpValue.length
          ? record.find(".wtt .arr").text()
          : arrExpValue.text(),
      },
    };
  }
  return { body: commonBodyData, hidden: {} };
}
