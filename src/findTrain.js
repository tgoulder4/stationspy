import cheerio from "cheerio";
import getCurrentDayTime from "./getDayTime.js";
//method: present stations

/**
 * Returns an emitter with live train updates
 * @param {string} stationName Name of the station or station code. E.g. 'WLF' or 'Whittlesford Parkway'
 */
export default async function findTrains(stationName) {
  //if stationName is the only parameter,
  const services = [];
  await fetch(
    `https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationName}/${getCurrentDayTime(
      "YYYY-MM-DD"
    )}/${getCurrentDayTime("HHmm")}`
  ).then((res) =>
    res.text().then((data) => {
      const $ = cheerio.load(data);
      $("a.service").each((i, el) => {
        //returns cheerio object as each child
        //if there are no pass stations
        const service = $(el);
        const UID = service.attr("href").match(/gb-nr:(\w+)/);
        if (!service.hasClass("pass")) {
          services.push({
            destination: service.find(".location.d").text(),
            departure: {
              actual: service.find(".real.a").text(),
              scheduled: service.find(".plan.a").text(),
            },
            serviceID: UID[1],
          });
        }
      });
      console.log(services);
    })
  );
}
