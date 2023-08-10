const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
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
    currentState = getCurrentState($);
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
  console.log(
    `Link followed: https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${getCurrentDayTime(
      "YYYY-MM-DD"
    )}/detailed`
  );
  let html = await response.text();
  return html;
}

//get state of train given html cheerio object
function getCurrentState($) {
  //service not found
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
    name:
      getStationNameAndCode($(".location").find(".name").last().text()).name ||
      null,
    code:
      getStationNameAndCode($(".location").find(".name").last().text()).code ||
      null,
  };
  //origin $(".location").first().text() is undefined. WHY?!
  let origin = {
    name:
      getStationNameAndCode($(".location").find(".name").first().text()).name ||
      null,
    code:
      getStationNameAndCode($(".location").find(".name").first().text()).code ||
      null,
  };
  //last actual arrival
  let mostRecentArrival = getMostRecentArrival();
  console.log(`mostRecentArrival: ${mostRecentArrival}`);

  //delay is last .delay.rt
  let delay =
    $(".delay.rt").last().text() ||
    $(".delay.late").last().text() ||
    $(".delay.early").last().text() ||
    "unknown";
  //if a most recent arrival exists,
  if (mostRecentArrival) {
    //and journey complete return reached destination
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
  let mostRecentDeparture = getMostRecentDeparture();
  console.log(`MostRecentDeparture: ${mostRecentDeparture}`);

  //a most recent arrival doesn't exist
  if (!mostRecentDeparture)
    return stateObject(
      "Not departed",
      origin,
      // nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );

  let status = getStatus();
  console.log(`Status: ${status}`);

  if (status) {
    let currentStation = getCurrentStation($(".platint").parent().parent());
    console.log(`CurrentStation: ${currentStation}`);
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
  if (mostRecentDeparture) {
    //if stopped there
    if (mostRecentDeparture.stopsHere) {
      return stateObject(
        "Departed",
        mostRecentDeparture,
        // nextStations,
        destination,
        delay,
        "journey",
        "continue"
      );
    } else {
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
  function getStatus() {
    return $(".platint").text() || null;
  }
  function getCurrentStation() {
    let elementObj = $(".platint").parent().parent();
    const { name, code } = getStationNameAndCode(
      $(".platint").siblings(".name").text()
    );
    return stationObject(
      //name of station
      name || null,
      //code of station
      code || null,
      //arrival of station
      {
        actual: elementObj.find(".arr.rt.act").text() || null,
      },
      //departure of station
      {
        actual: elementObj.find(".dep.rt.act").text() || null,
      },
      //stopsHere
      elementObj.find(".pass").length == 0
    );
  }
  function getMostRecentDeparture() {
    let elementObj = $(".dep.act").last();
    if (elementObj.length != 0) {
      const { name, code } = getStationNameAndCode(
        elementObj.parent().parent().find(".name").text()
      );
      return stationObject(
        //name of station
        name || null,
        //code of station
        code || null,
        //arrival of station
        { actual: $(".arr.act").last().text() || null },
        //departure of station
        { actual: elementObj.text() },
        //stopsHere
        elementObj.siblings(".pass").length == 0
      );
    } else {
      return null;
    }
  }
  function getMostRecentArrival() {
    // console.log(`.arr.act: ${$(".arr.act")}`);
    let elementObj = $(".arr.act").last();
    //if last actual arrival exists
    if (elementObj.length != 0) {
      //get the name and code
      const { name, code } = getStationNameAndCode(
        elementObj.parent().parent().find(".name").text()
      );
      return stationObject(
        //name of station
        name || null,
        //code of station
        code || null,
        //arrival of station
        { actual: elementObj.text() || null },
        //departure of station
        { actual: elementObj.siblings(".dep.act").text() || null },
        //stopsHere
        elementObj.siblings(".pass").length == 0
      );
    } else {
      return null;
    }
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
  const match = stationString.match(/([\w\s]+)(?:\s*(\[\w+\]))?$/);
  if (!match) {
    console.error("Failed to match station string:", stationString);
    return { name: null, code: null };
  }

  //regex is correct
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
