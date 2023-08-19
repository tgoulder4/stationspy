const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
import {
  stationResponse,
  information,
  createInformationBodyResponse,
  createDeparture,
  createStationResponse,
  state,
  recordInfo,
} from "./types/types";
var stationLocations = require("./map/stationLocations.json");
import { getLocationObject } from "./getInfo";
//method: present stations

/**
 * Returns an emitter with live train updates
 * @param {string} stationCode Station code. E.g. 'WLF'
 * @param {string} dateOfDeparture Date of departure in YYYY-MM-DD format. Defaults to current day.
 * @param {string} timeOfDeparture Time of departure in HHmm format. Defaults to current time.
 */
module.exports = async function findTrains(
  stationCode: string,
  dateOfDeparture: string = getCurrentDayTime("YYYY-MM-DD"),
  timeOfDeparture: string = getCurrentDayTime("HHmm")
): Promise<stationResponse | information["body"]> {
  //if stationName is 3 letters, destructure from map
  const callOutAndInfoValue = await fetch(
    `https://www.realtimetrains.co.uk/search/handler?location=${stationCode}`
  ).then((res) =>
    res.text().then((data) => {
      const $: cheerio.Root = cheerio.load(data);
      return { callout: $(".callout"), info: $(".info") };
    })
  );
  if (
    callOutAndInfoValue.callout.find("h3").text() ==
      "Cannot find primary location" ||
    callOutAndInfoValue.callout.find("p").text() ==
      "Sorry, no services were found in the next two hours." ||
    callOutAndInfoValue.info.find("h3").text() == "Bad request" ||
    !stationCode
  ) {
    return createInformationBodyResponse(
      "Error",
      "Please enter a valid station code or the date and time entered."
    );
  }
  let services = [];
  const stationName = stationLocations[stationCode].station_name;
  const location = {
    latitude: stationLocations[stationCode].latitude,
    longitude: stationLocations[stationCode].longitude,
  };
  console.log(`Location: ${location}`);
  await fetch(
    `https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationCode}/${dateOfDeparture}/${timeOfDeparture}`
  ).then((res) =>
    res.text().then((data) => {
      const $ = cheerio.load(data);
      $("a.service").each(async (i, el) => {
        const service = $(el);
        const UID = service.attr("href").match(/gb-nr:(\w+)/);
        console.log(`UID: ${UID[1]}`);
        const destination = service.find(".location.d").text();
        console.log(`Destination: ${destination}`);
        const stopsHere = !service.hasClass("pass");
        const arrival = {
          actual: service.find(".real.a").text() || null,
          scheduled: service.find(".plan.a").text() || null,
        };
        console.log(`Arrival: ${arrival}`);
        const departure = {
          actual: service.find(".real.d").text() || null,
          scheduled: service.find(".plan.d").text() || null,
        };
        console.log(`Departure: ${departure}`);
        const platform = service.find(".platform.act").text()
          ? service.find(".platform.act").text()
          : service.find(".platform.exp").text()
          ? service.find(".platform.exp").text()
          : null;
        console.log(`Platform: ${platform}`);
        const currentTrainLocation = getLocationObject(stationCode);
        if (!service.hasClass("pass")) {
          services.push(
            createDeparture(
              UID[1],
              destination,
              arrival,
              departure,
              platform,
              stopsHere,
              currentTrainLocation
            )
          );
        }
      });
      return createStationResponse(
        stationName,
        stationCode,
        location,
        services
      );
    })
  );
};
