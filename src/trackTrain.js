import cheerio from "cheerio";
import getCurrentDayTime from "./getDayTime.js";
import EventEmitter from "events";
import equal from "deep-equal";

/**
 * For trainID: findTrainsByStation() lists trains with their IDs. Or via realtimetrains.co.uk: '/gb-nr:XXXXXX' in URL.
 * @param {string} trainID
 * @param {number} refreshRate
 */
export default async function trackTrain(trainID, refreshRate = 5000) {
  const trainUpdateEmitter = new EventEmitter();
  //initialise variables
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
    //fetch rtt
    response = await fetch(
      `https://www.realtimetrains.co.uk/service/gb-nr:${trainID}/${getCurrentDayTime(
        "YYYY-MM-DD"
      )}/detailed`
    );
    //change to html
    html = await response.text();
    //load with cheerio for manipulation
    $ = cheerio.load(html);
    //get current state of train as currentState
    currentState = (() => {
      lastArrival = $(".realtime").last().find(".arr.rt.act");
      if ($(".info").length == 1) {
        //the service no longer exists in the rtt db, stop tracking
        clearInterval(tracking);
        return { status: "Journey doesn't exist" };
      } else if (lastArrival.length > 0) {
        //the journey is complete
        clearInterval(tracking);
        return { status: "Journey Complete" };
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
          //after a refresh, there is no badge on a station ('arriving','approaching' etc)
          if (!previousStation) {
            //it has no previous 'arrived at' station
            clearInterval(tracking);
            return { status: "Departed" }; //the train hasn't departed yet
          }
          //no badge and it has departed a station
          return { status: "Departed", station: previousStation }; //it's left its previous station but no action on the next yet
        } else {
          //there is a badge on a station ('arriving','approaching' etc)
          return { status: status, station: currentStation };
        }
      }
    })();
    //if the refreshed state is different
    !equal(currentState, previousState)
      ? (() => {
          //emit a new update
          trainUpdateEmitter.emit("UPDATE", currentState);
          //set the previous state equal to this one
          previousState = currentState;
        })()
      : //else do nothing
        "";
  }, refreshRate);
  //return the emitter for subscription
  return trainUpdateEmitter;
}
