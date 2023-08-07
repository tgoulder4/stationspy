//https://www.realtimetrains.co.uk/service/gb-nr:{SELECTEDSERVICE}/{CURRENTYEAR}-{CURRENTMONTH}-{CURRENTDAY}/detailed
const cheerio = require("cheerio");
const dayjs = require("dayjs");

//method: present stations
async function findTrainsByStation(
  stationName,
  date = getCurrentDayTime("YYYY-MM-DD"),
  when = getCurrentDayTime("HHmm")
) {
  //if stationName is the only parameter,
  const services = [];
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
          services.push({
            destination: service.find(".location.d").text(),
            departure: {
              actual: service.find(".real.a").text(),
              scheduled: service.find(".plan.a").text(),
            },
            serviceID: codeMatch[1],
          });
        }
      });
      console.log(services);
    })
  );
}
async function trackTrain(
  trainID,
  date = getCurrentDayTime("YYYY-MM-DD"),
  when = getCurrentDayTime("HHmm"),
  delay = 5000
  //find props by finding name of last arrived station (realtime)

  //find first .arr.exp. this is the next station. find the first .arr.rt.act, this is
  // the previous station if .platint doesn't exist.
) {
  let previousState = "";
  let currentState = "";
  let previousStation = "";
  let currentStation = "";
  let nextStation = "";
  let html = "";
  let response = "";
  let $ = "";
  let lastArrival = "";
  let status = "";
  const tracking = setInterval(async () => {
    response = await fetch(
      `https://www.realtimetrains.co.uk/service/gb-nr:${trainID}/${date}/detailed`
    );
    html = await response.text();
    $ = cheerio.load(html);
    //each state: { doors:"C" status:"At Platform", station:"Kings Norton" }
    // {status: "Heading to", station: "Birmingham New Street"}
    // {doors:"O", status:"At Platform" station:"Northfield"}
    currentState = (() => {
      lastArrival = $(".realtime").last().find(".arr.rt.act");
      if ($(".info").length == 1) {
        //the service no longer exists in the rtt db
        clearInterval(tracking); //stop tracking
        console.log("exiting loop");
        return "NOT_FOUND";
      } else if (lastArrival.length > 0) {
        //the journey is complete
        clearInterval(tracking);
        return "JOURNEY_COMPLETE";
      } else {
        //the train is undergoing its journey
        status = $(".platint").text();
        previousStation = $(".dep.rt.act")
          .last()
          .parent()
          .parent()
          .find(".name")
          .text();
        currentStation = $(".platint").siblings(".name").text();
        nextStation = $(".arr.exp")
          .first()
          .parent()
          .siblings(".location")
          .find(".name")
          .text();

        if (!currentStation) {
          //there is no status meaning it's between two stations
          return `Passed ${previousStation}`; //get next matching class of .location.name
        } else {
          //it's actioning on a platform
          return `Now ${status} ${currentStation}`;
        }
      } //close else
      //I want to continuously send updates via console when a change is detected in an element via cheerio
    })();
    currentState != previousState
      ? (() => {
          console.log(currentState);
          previousState = currentState;
        })()
      : "";
  }, delay);
}
//subscribe to the trackTrainEmitter. subscription(update=>console.log(update))
function getCurrentDayTime(timeString) {
  return dayjs().format(timeString);
}
//method: input service id to track & return updates
trackTrain("G59597");
