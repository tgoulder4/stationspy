import cheerio from "cheerio";
import getCurrentDayTime from "./getDayTime.js";
import EventEmitter from "events";
import equal from "deep-equal";

/**
 * Returns an emitter promise for live train updates
 * @param {string} serviceID
 * @param {number} refreshRate
 */
export default async function trackTrain(serviceID, refreshRate = 5000) {
  const trainUpdateEmitter = new EventEmitter();
  //initialise variables
  let previousState = "";
  let currentState = "";
  let previousStation = "";
  let currentStation = "";
  let html = "";
  let response = "";
  let $ = "";
  let lastArrival = "";
  let status = "";
  const tracking = setInterval(async () => {
    //fetch rtt
    response = await fetch(
      `https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${getCurrentDayTime(
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
      if ($(".info h3").text() == "Not found") {
        //the service no longer exists in the rtt db, stop tracking
        clearInterval(tracking);
        return { status: "Journey doesn't exist" };
      }
      if (lastArrival.length > 0) {
        //the journey is complete
        clearInterval(tracking);
        return { status: "Journey Complete" };
      }
      //the train is undergoing its journey
      status = $(".platint").text() || null;
      previousStation =
        $(".dep.rt.act").last().parent().parent().find(".name").text() || null;
      currentStation = $(".platint").siblings(".name").text() || null;
      nextStation =
        $(".arr.exp")
          .first()
          .parent()
          .siblings(".location")
          .find(".name")
          .text() || null;

      if (!currentStation) {
        //after a refresh, there is no badge on a station ('arriving','approaching' etc)
        if (!previousStation) {
          //it has no previous 'arrived at' station
          clearInterval(tracking);
          return { status: "Not yet departed" }; //the train hasn't departed yet
        }
        //no badge and it has departed a station
        return { status: "Departed", station: previousStation }; //it's left its previous station but no action on the next yet
      }
      //there is a badge on a station ('arriving','approaching' etc)
      return { status: status, station: currentStation };
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
