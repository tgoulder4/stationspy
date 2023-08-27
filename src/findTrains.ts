const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const util = require("util");
import {
  stationResponse,
  information,
  createInformationBodyResponse,
  createDeparture,
  createStationResponse,
  Departure,
  state,
  stationLocation,
} from "./types/types";
var stationLocations = require("./map/stationLocations.json");
var stationCodes = require("./map/stationCodes.json");
import { trackOnce, getHTML } from "./trackTrain";
//method: present stations

export const findStationNameAndCode = (stationNameOrCode: string) => {
  //if a match of 3 capital letters,
  let stationName = "";
  let stationCode = "";
  // console.log(
  //   `stationName: ${stationName}, stationCode: ${stationCode}, stationNameOrCode: ${stationNameOrCode}`
  // );
  const match = stationNameOrCode.trim().match(/^[A-Za-z]{3}$/);
  if (match) {
    // console.log(`match: ${match}`);
    const jsonMatch: stationLocation = stationLocations[match[0].toUpperCase()];
    if (jsonMatch) {
      stationName = jsonMatch.station_name;
      stationCode = match[0].toUpperCase();
    } else {
      stationName = null;
      stationCode = null;
    }
    // console.log(`stationName: ${stationName}`);
    // console.log(`stationCode: ${stationCode}`);
  } else {
    stationName = stationNameOrCode;
    const jsonMatch = stationCodes["stations"].find(
      (station) => station["Station Name"] == stationNameOrCode
    );
    if (jsonMatch) {
      stationCode = jsonMatch["CRS Code"];
    } else {
      stationCode = null;
    }
  }
  return { stationName, stationCode };
};
/**
 * Returns an emitter with live train updates
 * @param {string} stationCode Station code. E.g. 'WLF'
 * @param {string} dateOfDeparture Date of departure in YYYY-MM-DD format. Defaults to current day.
 * @param {string} timeOfDeparture Time of departure in HHmm format. Defaults to current time.
 */
export default async function findTrains(
  stationNameOrCode: string,
  dateOfDeparture: string = getCurrentDayTime("YYYY-MM-DD"),
  timeOfDeparture: string = getCurrentDayTime("HHmm")
): Promise<stationResponse | information["body"]> {
  //if stationName is 3 letters, destructure from map
  const { stationName, stationCode } =
    findStationNameAndCode(stationNameOrCode);
  // console.log(`stationName: ${stationName}, stationCode: ${stationCode}`)
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
    callOutAndInfoValue.info.find("h3").text() == "Bad request" ||
    !stationNameOrCode
  ) {
    return createInformationBodyResponse(
      "Error",
      "Please enter a valid station code or the date and time entered."
    );
  }
  const location = {
    latitude: stationCode ? stationLocations[stationCode].latitude : null,
    longitude: stationCode ? stationLocations[stationCode].longitude : null,
  };
  const services: Array<Departure> = [];
  //rate limiter
  // await new Promise((r) => setTimeout(r, 500));
  const res = await fetch(
    `https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationCode}/${dateOfDeparture}/${timeOfDeparture}`
  );
  const $ = cheerio.load(await res.text());

  for (const el of $("a.service").toArray()) {
    const service = $(el);
    const UID = service.attr("href").match(/gb-nr:(\w+)/);
    // console.log(`UID: ${UID[1]}`);
    const destination = service.find(".location.d").text();
    // console.log(`Destination: ${destination}`);
    const stopsHere = !service.hasClass("pass");
    const arrival = {
      actual: service.find(".real.a.act").text() || null,
      scheduled: service.find(".real.a.exp").text()
        ? service.find(".real.a.exp").text()
        : service.find(".plan.a.gbtt").text() || null,
    };
    // console.log(`Arrival: ${arrival}`);
    const departure = {
      actual: service.find(".real.d.act").text() || null,
      scheduled: service.find(".real.d.exp").text()
        ? service.find(".real.d.exp").text()
        : service.find(".plan.d.gbtt").text() || null,
    };
    // console.log(`Departure: ${departure}`);
    const platform = service.find(".platform.act").text()
      ? service.find(".platform.act").text()
      : service.find(".platform.exp").text()
      ? service.find(".platform.exp").text()
      : null;
    const currentTrainState: state["body"] | null = await trackOnce(UID[1]); //.status and .station only
    if (!service.hasClass("pass")) {
      services.push(
        createDeparture(
          UID[1],
          destination,
          arrival,
          departure,
          platform,
          stopsHere,
          currentTrainState
        )
      );
    }
  }
  return createStationResponse(stationName, stationCode, location, services);
}
