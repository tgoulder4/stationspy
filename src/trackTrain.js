const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");

/**
 * FOR PROD: Module.exports this only. Returns an emitter promise for live train updates.
 * @param {string} serviceID
 * @param {number} refreshRate
 */
async function trackTrain(serviceID, refreshRate = 5000) {
  if (!serviceID) {
    return "Enter a service ID.";
  }
  const trainUpdateEmitter = new EventEmitter();
  let previousState = "";
  let currentState = "";
  let $ = "";
  let html = "";
  emitUpdate(trainUpdateEmitter, {
    body: {
      notification: "Now tracking",
    },
    hidden: {
      update_type: "journey",
      action: "continue",
    },
  });
  //loop here every 5s. 'tracking' needed for strange js behaviour
  const loop = setInterval(async () => {
    html = await getHTML(serviceID);
    $ = cheerio.load(html);
    //get current state of train as currentState
    currentState = await getCurrentState($);
    //check if end of loop
    if (currentState.hidden.action == "end") {
      //emit final update
      emitUpdate(trainUpdateEmitter, currentState);
      //stop loop
      clearInterval(loop);
    }
    //if the refreshed state is different
    if (!equal(currentState, previousState)) {
      emitUpdate(trainUpdateEmitter, currentState);
      previousState = currentState;
    }
  }, refreshRate);
  //return the emitter for subscription
  return trainUpdateEmitter;
}

async function getHTML(serviceID) {
  //get real data
  let response = await fetch(
    `https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${getCurrentDayTime(
      "YYYY-MM-DD"
    )}/detailed`
  );
  let html = await response.text();
  return html;
}

//get state of train given html cheerio object
async function getCurrentState($) {
  //service no longer exists
  if ($(".info h3").text() == "Not found") {
    //return error update
    return {
      body: {
        error: "Journey doesn't exist.",
      },
      hidden: {
        update_type: "error",
        action: "end",
      },
    };
  }
  //get last .realtime, holds value if contains arr rt act
  let lastArrival = {
    name: $(".arr.act").last().parent().parent().find(".name").text(),
  };
  let destination = { name: $(".name").last().text() };
  let lastDeparture = { name: $(".dep.act").last() };
  //delay is last .delay.rt
  let delay =
    $(".delay.rt").last().text() || $(".delay.late").last().text() || 0;
  //previousStation is last station departed (rt)
  let previousStation = {
    name:
      //last rt act dep or first station
      $(".dep.act").last().parent().parent().find(".name").text() || null,
    pickupStation: $(".dep.act").last().siblings(".pass").length == 0,
  };
  //nextStation is next passenger station
  let nextStation =
    $(".arr.exp").first().parent().siblings(".location").find(".name").text() ||
    null;
  //last .realtime contains arr rt act - the journey is complete
  if (lastArrival.name == destination.name) {
    //return journey update
    return {
      body: {
        status: "Complete",
        station: lastArrival.name,
        departure: { scheduled: "", actual: "" },
        arrival: { scheduled: "", actual: "" },
        nextStation: null,
        delay: delay,
      },
      hidden: {
        update_type: "journey",
        action: "end",
      },
    };
  }
  if (lastArrival.name.length == 0) {
    return {
      body: {
        status: "Not departed",
        station: $(".name").first().text(),
        departure: { scheduled: "", actual: "" },
        arrival: { scheduled: "", actual: "" },
        nextStation: nextStation,
        delay: delay,
      },
      hidden: {
        update_type: "journey",
        action: "continue",
      },
    };
  }
  //the train is undergoing its journey
  //no badge?
  let status = $(".platint").text() || null;
  //currentStation is actioning station, first station or last
  if (status) {
    let currentStation = {
      name: $(".platint").siblings(".name").text() || null,
      arrival: {
        actual: $(".platint").parent().parent().find(".arr.rt.act").text(),
      },
      pickupStation: $(".platint").parent().parent().find(".pass").length == 0,
    };
    return {
      body: {
        status: status,
        station: currentStation,
        departure: { scheduled: "", actual: "" },
        arrival: { scheduled: "", actual: "" },
        nextStation: nextStation,
        delay: delay,
      },
      hidden: {
        update_type: "journey",
        action: "continue",
      },
    };
  }
  //no badge
  return {
    body: {
      status: "Passed",
      station: previousStation,
      departure: { scheduled: "", actual: "" },
      arrival: { scheduled: "", actual: "" },
      nextStation: nextStation,
      delay: delay,
    },
    hidden: {
      update_type: "journey",
      action: "continue",
    },
  };

  //after a refresh, there is no badge on a station
  if (!currentStation.name) {
    //no badge found but previous 'arrived at' station
    //DO: see if previousStation was a passenger station
    //passed status, departed status with next station
  }
  //badge on a station ('arriving','approaching' etc)
  // console.log("status on a current station");
}
//update to train state
function emitUpdate(emitter, stateUpdate) {
  //if it's a journey update
  emitter.emit(`${stateUpdate.hidden.update_type}Update`, stateUpdate.body);
}
module.exports = { trackTrain, getHTML, getCurrentState, emitUpdate };
