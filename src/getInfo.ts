function getDelay(record: JQuery<any>) {
  return parseInt(record.find(".delay").text());
}
function parseStationString(record: JQuery<any>) {
  return parseStationNameAndCode(record.find(".name").text());
}
function parseStationNameAndCode(stationString) {
  const match = stationString.match(/^(.+?)(?:\s(\[\w+\]))?$/);
  if (!match) {
    // console.error("Failed to match station string:", stationString);
    return { name: null, code: null };
  }
  //regex is correct
  return {
    name: match[1].trimEnd(),
    code: match[2],
  };
}
export default function getInfo(record: JQuery<any>): recordInfo["body"] {
  const { name, code } = parseStationString(record);
  const schedule: JQuery<any> = record.find(".wtt");
  const arrExpValue = record.find(".arr.exp");
  const arrActValue = record.find(".arr.act");
  const depExpValue = record.find(".dep.exp");
  const depActValue = record.find(".dep.act");
  const arrValueExists = arrExpValue.length != 0 && arrActValue.length != 0;
  const depValueExists = depExpValue.length != 0 && depActValue.length != 0;
  const platform = record.find(".platform").text();
  const delay = getDelay(record);
  const stopsHere = record.find(".pass").length == 0;
  const commonData: recordInfo["body"] = {
    name: name,
    code: code,
    platform: platform,
    stopsHere: stopsHere,
    delay: delay,
  };
  //if no dep values
  if (arrValueExists && depValueExists) {
    return {
      ...commonData,
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
    return {
      ...commonData,
      departure: {
        actual: depActValue.text(),
        scheduled: depExpValue.length
          ? record.find(".wtt .dep").text()
          : depExpValue.text(),
      },
    };
  }
  if (arrValueExists && !depValueExists) {
    return {
      ...commonData,
      arrival: {
        actual: arrActValue.text(),
        scheduled: arrExpValue.length
          ? record.find(".wtt .arr").text()
          : arrExpValue.text(),
      },
    };
  }
  return commonData;
}
