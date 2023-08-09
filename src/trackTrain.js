const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
const { transitData } = require("../tests/testData/testhtml.js");

/**
 * FOR PROD: Module.exports this only. Returns an emitter promise for live train updates.
 * @param {string} serviceID
 * @param {number} refreshRate
 */
async function trackTrain(serviceID, refreshRate = 5000) {
  let previousState = "";
  let currentState = "";
  if (!serviceID) {
    return "Enter a service ID.";
  }
  const trainUpdateEmitter = new EventEmitter();
  //loop here every 5s. 'tracking' needed for strange js behaviour
  const loop = setInterval(async () => {
    let $ = "";
    let html = "";
    html = await getHTML(serviceID);
    // html = await transitData.arriving();
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
  //USE OF .last() NOT WORKING
  let lastArrival = stationObject(
    //name of station
    $(".arr.act").last().parent().parent().find(".name").text() || null,
    //arrival of station
    { actual: $(".arr.act").last().text() || null },
    //departure of station
    { actual: $(".arr.act").last().siblings(".dep.act").text() || null },
    //pickupStation
    $(".arr.act").last().siblings(".pass").length == 0
  );
  let destination = { name: $(".name").last().text() };
  // console.log(`destination: ${destination.name}`);
  // console.log(`arr act: ${$(".arr.act").text()}`);
  let previousDeparture = stationObject(
    //name of station
    $(".dep.act").last().parent().parent().find(".name").text() || null,
    //arrival of station
    { actual: $(".arr.act").last().text() || null },
    //departure of station
    { actual: $(".dep.act").last().text() },
    //pickupStation
    $(".dep.act").last().siblings(".pass").length == 0
  );
  //delay is last .delay.rt
  let delay =
    $(".delay.rt").last().text() || $(".delay.late").last().text() || 0;
  //nextStation is next passenger station
  const nextStations = [];
  $(".arr.exp").each((i, el) => {
    nextStations.push({
      name: $(el).parent().siblings(".location").find(".name").text(),
      arrival: { scheduled: $(el).text() },
      departure: { scheduled: $(el).siblings(".dep.exp").text() },
    });
  });
  //last .realtime contains arr rt act - the journey is complete
  if (lastArrival.name == destination.name) {
    //return journey update
    return stateObject(
      "Complete",
      lastArrival,
      null,
      destination,
      delay,
      "journey",
      "end",
      pickupStation
    );
  }
  if (!previousDeparture) {
    return stateObject(
      "Not departed",
      nextStations[0],
      nextStations,
      destination,
      delay,
      "journey",
      "continue",
      pickupStation
    );
  }
  //the train is undergoing its journey
  //no badge?
  let status = $(".platint").text() || null;
  //if a badge exists
  if (status) {
    let currentStation = stationObject(
      //name of station
      $(".platint").siblings(".name").text() || null,
      //arrival of station
      {
        actual:
          $(".platint").parent().parent().find(".arr.rt.act").text() || null,
      },
      //departure of station
      {
        actual:
          $(".platint").parent().parent().find(".dep.rt.act").text() || null,
      },
      //pickupStation
      $(".platint").parent().parent().find(".pass").length == 0
    );
    return stateObject(
      status,
      currentStation,
      nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );
  }
  //no badge
  if (previousDeparture.pickupStation) {
    return stateObject(
      "Departed",
      previousDeparture,
      nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );
  }
  return stateObject(
    "Passed",
    previousDeparture,
    nextStations,
    destination,
    delay,
    "journey",
    "continue"
  );
}

function stationObject(name, arrival, departure, pickupStation) {
  return {
    name: name,
    arrival: arrival,
    departure: departure,
    pickupStation: pickupStation,
  };
}

/**
 *
 * @param {string} status Status of train - Badge text or custom
 * @param {string} station Station regarding status
 * @param {string} nextStations
 * @param {string} destination
 * @param {string} delay
 * @param {string} update_type
 * @param {string} action
 * @returns
 */
function stateObject(
  status,
  station,
  nextStations,
  destination,
  delay,
  update_type,
  action
) {
  return {
    body: {
      status: status,
      station: station,
      nextStations: nextStations,
      destination: destination.name,
      delay: delay,
    },
    hidden: {
      update_type: update_type,
      action: action,
    },
  };
}
//update to train state
function emitUpdate(emitter, stateUpdate) {
  //if it's a journey update
  emitter.emit(`${stateUpdate.hidden.update_type}Update`, stateUpdate.body);
}
module.exports = { trackTrain, getHTML, getCurrentState, emitUpdate };
