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
      console.log(
        `link searched: https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationName}/${date}/${when}`
      );
      const $ = cheerio.load(data);
      $("a.service").each((i, el) => {
        //returns cheerio object as each child
        //if there are no pass stations
        const service = $(el);
        const codeMatch = service.attr("href").match(/gb-nr:(\w+)/);
        if (!service.hasClass("pass")) {
          stations.push({
            scheduleTime: service.find(".plan.a").text(),
            destination: service.find(".location.d").text(),
            actualTime: service.find(".real.a").text(),
            serviceID: codeMatch[1],
          });
        }
      });
      console.log(stations);
    })
  );
}
async function trackTrain(
  trainID,
  date = getCurrentDayTime("YYYY-MM-DD"),
  when = getCurrentDayTime("HHmm")
) {
  let prevStation = "";
  let currentStation = "";
  let nextStation = "";
  await fetch(
    `https://www.realtimetrains.co.uk/service/gb-nr:${trainID}/${date}/detailed`
  ).then((res) => {
    res.text().then((data) => {
      const $ = cheerio.load(data);
      const completedJourney = "";
      //.arr.exp.last() has children .TD.(R1)? instead
      const statusObj = $(".platint");
      if (!completedJourney) {
        switch (statusObj.length) {
          case 0:
            prevStation = currentStation;
            nextStation = currentStation = "";
            console.log(`Between ${prevStation} and `); //get next matching class of .location.name
          case 1:
            currentStation = statusObj.parent().find(".name").text();
        }
      } else {
        console.log("journey complete.");
      }

      //I want to continuously send updates via console when a change is detected in an element via cheerio
    });
  });
}
function getCurrentDayTime(timeString) {
  return dayjs().format(timeString);
}
//method: input service id to track & return updates
trackTrain("L98308");
