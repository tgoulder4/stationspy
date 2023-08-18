const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
//method: present stations

/**
 * Returns an emitter with live train updates
 * @param {string} stationName Name of the station or station code. E.g. 'WLF' or 'Whittlesford Parkway'
 */
module.exports = async function findTrains(
  stationName,
  dateOfDeparture = "2023-08-16" //getCurrentDayTime("YYYY-MM-DD")
) {
  //if stationName is 3 letters, destructure from map
  if (
    (await fetch(
      `https://www.realtimetrains.co.uk/search/handler?location=${stationName}`
    ).then((res) =>
      res.text().then((data) => {
        const $ = cheerio.load(data);
        return $(".callout.condensed h3").text();
      })
    )) == "Cannot find primary location" ||
    !stationName
  ) {
    return "Please enter a valid station code.";
  }
  const services = [];
  await fetch(
    `https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationName}/${dateOfDeparture}/${getCurrentDayTime(
      "HHmm"
    )}`
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
            arrival: {
              actual: service.find(""),
            },
            departure: {
              actual: service.find(".real.a").text(),
              scheduled: service.find(".plan.a").text(),
            },
            serviceID: UID[1],
          });
        }
      });
    })
  );
  return services;
};
