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
} from "./types/types";
var stationLocations = require("./map/stationLocations.json");
import { trackOnce } from "./trackTrain";
//method: present stations

/**
 * Returns an emitter with live train updates
 * @param {string} stationCode Station code. E.g. 'WLF'
 * @param {string} dateOfDeparture Date of departure in YYYY-MM-DD format. Defaults to current day.
 * @param {string} timeOfDeparture Time of departure in HHmm format. Defaults to current time.
 */
export default async function findTrains(
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
  //if a match of 3 capital letters,
  let stationName = "";
  const match = stationName.match(/[A-Z]{3}/);
  stationName = !match
    ? stationName
    : stationLocations[stationCode].station_name;
  const location = {
    latitude: match ? stationLocations[stationCode].latitude : null,
    longitude: match ? stationLocations[stationCode].longitude : null,
  };
  const services: Array<Departure> = [];
  //rate limiter
  await new Promise((r) => setTimeout(r, 2000));
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
    // console.log(`Platform: ${platform}`);
    await new Promise((r) => setTimeout(r, 1000));
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
