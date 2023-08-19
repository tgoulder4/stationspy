const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
import {
  stationResponse,
  information,
  createInformationBodyResponse,
  createDeparture,
  createStationResponse,
} from "./types/types";
//method: present stations

/**
 * Returns an emitter with live train updates
 * @param {string} stationName Name of the station or station code. E.g. 'WLF' or 'Whittlesford Parkway'
 * @param {string} dateOfDeparture Date of departure in YYYY-MM-DD format. Defaults to current day.
 * @param {string} timeOfDeparture Time of departure in HHmm format. Defaults to current time.
 */
module.exports = async function findTrains(
  stationName: string,
  dateOfDeparture: string = getCurrentDayTime("YYYY-MM-DD"),
  timeOfDeparture: string = getCurrentDayTime("HHmm")
): Promise<stationResponse | information["body"]> {
  //if stationName is 3 letters, destructure from map
  if (
    (await fetch(
      `https://www.realtimetrains.co.uk/search/handler?location=${stationName}`
    ).then((res) =>
      res.text().then((data) => {
        const $: cheerio.Root = cheerio.load(data);
        return $(".callout h3").text();
      })
    )) == "Cannot find primary location" ||
    !stationName
  ) {
    return createInformationBodyResponse(
      "Error",
      "Please enter a valid station code or name."
    );
  }
  let services = [];
  await fetch(
    `https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationName}/${dateOfDeparture}/${timeOfDeparture}`
  ).then((res) =>
    res.text().then((data) => {
      const $ = cheerio.load(data);
      $("a.service").each((i, el) => {
        const service = $(el);
        const UID = service.attr("href").match(/gb-nr:(\w+)/);
        const destination = service.find(".location.d").text();
        const arrival = {
          actual: service.find(".real.a").text(),
          scheduled: service.find(".plan.a").text(),
        };
        const departure = {
          actual: service.find(".real.d").text(),
          scheduled: service.find(".plan.d").text(),
        };
        const platform = service.find(".platform .act").text();
        const delay = service.find(".late").text();
        const stopsHere = !service.hasClass("pass");
        if (!service.hasClass("pass")) {
          services.push(
            createDeparture(
              UID[1],
              destination,
              arrival,
              departure,
              platform,
              delay,
              stopsHere
            )
          );
        }
      });
      const stationCode = $(".station-code").text();
      const location = {
        lat: $(".station-lat").text(),
        long: $(".station-long").text(),
      };
      return createStationResponse(
        stationName,
        stationCode,
        location,
        services
      );
    })
  );
};
