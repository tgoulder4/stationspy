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
      stations.push(() => {
        $("a.service").each((trainRow) => ({})); //push the location, push the destination
      });
    })
  );
  console.log(stations);
}

function getCurrentDayTime(timeString) {
  return dayjs().format(timeString);
}
//method: input service id to track & return updates
presentStations("BRV");
