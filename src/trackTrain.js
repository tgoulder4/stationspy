import cheerio from "cheerio";
import getCurrentDayTime from "./getDayTime.js";
import EventEmitter from "events";
/**
 * For trainID: findTrainsByStation() lists trains with their IDs. Or via realtimetrains.co.uk: '/gb-nr:XXXXXX' in URL.
 * @param {string} trainID
 * @param {number} refreshRate
 */
export default async function trackTrain(
  trainID,
  refreshRate = 5000
  //find props by finding name of last arrived station (realtime)

  //find first .arr.exp. this is the next station. find the first .arr.rt.act, this is
  // the previous station if .platint doesn't exist.
) {
  const trainUpdateEmitter = new EventEmitter();
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
      `https://www.realtimetrains.co.uk/service/gb-nr:${trainID}/${getCurrentDayTime(
        "YYYY-MM-DD"
      )}/detailed`
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
          if (!previousStation) {
            clearInterval(tracking);
            return `NOT_DEPARTED`;
          }
          return `PASS ${previousStation}`; //get next matching class of .location.name
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
  }, refreshRate);
}
