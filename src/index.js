//https://www.realtimetrains.co.uk/service/gb-nr:{SELECTEDSERVICE}/{CURRENTYEAR}-{CURRENTMONTH}-{CURRENTDAY}/detailed
const cheerio = require("cheerio");
const { axios } = require("axios");
const dayjs = require("dayjs");

//method: present stations
async function presentStations(
  stationName,
  date = getCurrentDayTime("YYYY-MM-DD"),
  when = getCurrentDayTime("HHmm")
) {
  //if stationName is the only parameter,
  const stations = [];
  await fetch(
    `https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationName}/${date}/${when}`
  ).then((res) =>
    res.text().then((data) => {
      const $ = cheerio.load(data);
      $("a.service").each((i, service) => {
        console.log("pushing....");
        if (service.children(".pass").length === 0) {
          //only show the non-pass stations
          stations.push({
            // add the station to the list of stations to display. not working.
            location: service.children(".location").text(),
            plannedArrival: service.children("plan").text(),
          });
        }
      });
    })
  );
}

function getCurrentDayTime(timeString) {
  return dayjs().format(timeString);
}
//method: input service id to track & return updates
presentStations("BRV");
