const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
const { transitData, erronousData } = require("../tests/testData/testData");
/**
 * FOR PROD: Module.exports this only. Returns an emitter promise for live train updates.
 * @param {string} serviceID
 * @param {number} timeTillRefresh
 */
async function trackTrain(serviceID, timeTillRefresh = 5000) {
  let previousState = "";
  let currentState = "";
  if (!serviceID) {
    return "Enter a service ID.";
  }
  const trainUpdateEmitter = new EventEmitter();
  //loop here every 5s. 'const loop =' needed for strange js behaviour
  const loop = setInterval(async () => {
    let html = await getHTML(serviceID);
    let $ = cheerio.load(html);
    //get current state of train as currentState
    currentState = await getCurrentState($);
    //check if end of loop
    if (currentState.hidden.action == "end") {
      //stop loop
      clearInterval(loop);
    }
    //if the refreshed state is different
    if (!equal(currentState, previousState)) {
      emitUpdate(trainUpdateEmitter, currentState);
      previousState = currentState;
    }
  }, timeTillRefresh);
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
  //service no longer exists for whatever reasons
  if ($(".info h3").text() == "Not found") {
    //return error update
    return {
      body: {
        error: "Not found",
      },
      hidden: {
        update_type: "error",
        action: "end",
      },
    };
  }
  //train is cancelled
  if ($(".callout.alert h4").text().length) {
    //return error update
    return {
      body: {
        error: $(".callout.alert h4").text(),
        details: $(".callout.alert p").text(),
      },
      hidden: {
        update_type: "error",
        action: "end",
      },
    };
  }
  let destination = {
    name: getStationNameAndCode($(".location").last().text()).name || null,
    code: getStationNameAndCode($(".location").last().text()).code || null,
  };

  let mostRecentArrival = null;
  //if there is a last actual arrival,
  if ($(".arr.act").last().length != 0) {
    //get the name and code
    const { name, code } = getStationNameAndCode(
      $(".arr.act").last().parent().parent().find(".name").text()
    );
    mostRecentArrival = stationObject(
      //name of station
      name || null,
      //code of station
      code || null,
      //arrival of station
      { actual: $(".arr.act").last().text() || null },
      //departure of station
      { actual: $(".arr.act").last().siblings(".dep.act").text() || null },
      //stopsHere
      $(".arr.act").last().siblings(".pass").length == 0
    );
  }
  //delay is last .delay.rt
  let delay =
    $(".delay.rt").last().text() ||
    $(".delay.late").last().text() ||
    $(".delay.early").last().text() ||
    "unknown";
  //if journey complete
  if (mostRecentArrival) {
    if (mostRecentArrival.name == destination.name) {
      //return journey update
      return stateObject(
        "Reached destination",
        mostRecentArrival,
        // null, //nextStation
        destination,
        delay,
        "journey",
        "end"
      );
    }
  }
  //mostRecentArrival declared for change
  let mostRecentDeparture = null;
  //define mostRecentDeparture
  if ($(".dep.act").last().length != 0) {
    const { name, code } = getStationNameAndCode(
      $(".dep.act").last().parent().parent().find(".name").text()
    );
    mostRecentDeparture = stationObject(
      //name of station
      name || null,
      //code of station
      code || null,
      //arrival of station
      { actual: $(".arr.act").last().text() || null },
      //departure of station
      { actual: $(".dep.act").last().text() },
      //stopsHere
      $(".dep.act").last().siblings(".pass").length == 0
    );
  }

  //if there is not a most recent arrival
  if (!mostRecentDeparture) {
    //not yet departed
    return stateObject(
      "Not departed",
      nextStations[0],
      // nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );
  }
  //PRTEV DEPARTURE WAS HERE
  //nextStation is next passenger station
  const nextStations = [];
  $(".arr.exp").each((i, el) => {
    const { name, code } = getStationNameAndCode(
      $(el).parent().siblings(".location").find(".name").text()
    );
    nextStations.push(
      stationObject(
        name || null,
        code || null,
        { scheduled: $(el).text() || null },
        { scheduled: $(el).siblings(".dep.exp").text() || null },
        $(el).parent().find(".pass").length == 0
      )
    );
  });
  //last .realtime contains arr rt act - the journey is complete
  //the train is undergoing its journey
  //no badge?
  let status = $(".platint").text() || null;
  //if a badge exists
  if (status) {
    const { name, code } = getStationNameAndCode(
      $(".platint").siblings(".name").text()
    );
    let currentStation = stationObject(
      //name of station
      name || null,
      //code of station
      code || null,
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
      //stopsHere
      $(".platint").parent().parent().find(".pass").length == 0
    );
    //if badge
    return stateObject(
      status,
      currentStation,
      // nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );
  }

  //if !badge and stopped there
  if (!status && mostRecentDeparture.stopsHere) {
    return stateObject(
      "Departed",
      mostRecentDeparture,
      // nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );
  }
  //if !badge & !stopped there
  if (!status && !mostRecentDeparture.stopsHere) {
    return stateObject(
      "Passed",
      mostRecentDeparture,
      // nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );
  }
}

function stationObject(name, code, arrival, departure, stopsHere) {
  return {
    name: name,
    code: code,
    arrival: arrival,
    departure: departure,
    stopsHere: stopsHere,
  };
}
function getStationNameAndCode(stationString) {
  const match = stationString.match(/^([\w\s]+)(\[\w+\])?$/);
  return {
    name: match[1].trimEnd(),
    code: match[2],
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
  // nextStations,
  destination,
  delay,
  update_type,
  action
) {
  return {
    body: {
      status: status,
      station: station,
      // nextStations: nextStations,
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
module.exports = {
  trackTrain,
  getHTML,
  getCurrentState,
  getStationNameAndCode,
  emitUpdate,
  stateObject,
};
