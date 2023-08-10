const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
const { platform } = require("os");
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
  const date = getCurrentDayTime("YYYY-MM-DD");
  const loop = setInterval(async () => {
    let html = await getHTML(serviceID, date);

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

async function getHTML(serviceID, date) {
  //get real data
  let response = await fetch(
    `https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${date}/detailed`
  );
  // console.log(
  //   `Link followed: https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${getCurrentDayTime(
  //     "YYYY-MM-DD"
  //   )}/detailed`
  // );
  let html = await response.text();
  return html;
}

//get state of train given html cheerio object
function getCurrentState($) {
  //service not found
  if ($(".info h3").text() == "Not found") {
    //return error update
    return errorObject("Not found", "Please enter a valid station code.");
  }
  //train is cancelled
  if ($(".callout h4").text().length) {
    //return error update
    return errorObject(
      "This service is cancelled.",
      $(".callout p").text() || null
    );
  }
  //delay
  const delaysWithText = $(".delay").filter(function () {
    return $(this).text().trim() !== ""; // Only keep elements with non-empty text
  });

  const delay =
    delaysWithText.last().text() == "Dly"
      ? null
      : delaysWithText.last().text() || null;
  let destination = {
    name:
      getStationNameAndCode($(".location").find(".name").last().text()).name ||
      null,
    code:
      getStationNameAndCode($(".location").find(".name").last().text()).code ||
      null,
  };
  let status = getStatus();
  // console.log(`Status: ${status}`);

  if (status) {
    let currentStation = getCurrentStation();
    // console.log(`CurrentStation: ${currentStation}`);
    if (currentStation) {
      //if stops here
      if (currentStation.stopsHere) {
        //it's always 'approaching'
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
      if (!currentStation.stopsHere) {
        return stateObject(
          "Passing",
          currentStation,
          // nextStations,
          destination,
          delay,
          "journey",
          "continue"
        );
      }
    }
  }
  // console.log(
  //   `Destination.name: ${destination.name}, Destination.code: ${destination.code}`
  // );

  let origin = {
    name:
      //first station with applicable rt info
      getStationNameAndCode(
        $(".dep.exp").first().parent().parent().find(".name").text()
      ).name || null,
    code:
      getStationNameAndCode(
        $(".dep.exp").first().parent().parent().find(".name").text()
      ).code || null,
  };
  //last actual arrival
  let stationArrived = getStationArrived();
  // console.log(`stationArrived: ${stationArrived}`);

  //if a most recent arrival exists,
  if (stationArrived) {
    //and journey complete return reached destination
    if (stationArrived.name == destination.name) {
      //return journey update
      return stateObject(
        "Reached destination",
        stationArrived,
        // null, //nextStation
        destination,
        delay,
        "journey",
        "end"
      );
    }
    if (stationArrived.arrival.actual && !stationArrived.departure.actual) {
      return stateObject(
        "At platform",
        stationArrived,
        // nextStations,
        destination,
        delay,
        "journey",
        "continue"
      );
    }
  }

  let stationDeparted = getStationDeparted();
  // console.log(`stationDeparted: ${stationDeparted}`);

  if (stationDeparted) {
    //if stopped there
    if (stationDeparted.stopsHere) {
      return stateObject(
        "Departed",
        stationDeparted,
        // nextStations,
        destination,
        delay,
        "journey",
        "continue"
      );
    }
    if (!stationDeparted.stopsHere) {
      return stateObject(
        "Passed",
        stationDeparted,
        // nextStations,
        destination,
        delay,
        "journey",
        "continue"
      );
    }
  }
  if (!stationDeparted) {
    return stateObject(
      "Not departed",
      origin,
      // nextStations,
      destination,
      delay,
      "journey",
      "continue"
    );
  }
  return "There was an error finding the train's current status.";
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
        scheduled: elementObj.find(".wtt .arr").text() || null,
      },
      //platform
      {
        actual: elementObj.find(".platform.act").text() || null,
        scheduled: elementObj.find(".platform.exp").text() || null,
      },
      //departure of station
      {
        actual: elementObj.find(".dep.rt.act").text() || null,
        scheduled: elementObj.find(".wtt .dep").text() || null,
      },
      //stopsHere
      elementObj.find(".pass").length == 0
    );
  }
  function getStationDeparted() {
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
        {
          actual: elementObj.siblings(".arr.act").text() || null,
          scheduled:
            elementObj.parent().parent().find(".wtt .arr").text() || null,
        },
        //platform
        {
          actual: elementObj.parent().siblings(".platform.act").text() || null,
          scheduled:
            elementObj.parent().siblings(".platform.exp").text() || null,
        },
        //departure of station
        {
          actual: elementObj.text() || null,
          scheduled:
            elementObj.parent().parent().find(".wtt .dep").text() || null,
        },
        //stopsHere
        elementObj.siblings(".pass").length == 0
      );
    } else {
      return null;
    }
  }
  function getStationArrived() {
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
        {
          actual: elementObj.text() || null,
          scheduled:
            elementObj.parent().parent().find(".wtt .arr").text() || null,
        },
        //platform
        {
          actual: elementObj.parent().siblings(".platform.act").text() || null,
          scheduled:
            elementObj.parent().siblings(".platform.exp").text() || null,
        },
        //departure of station
        {
          actual: elementObj.siblings(".dep.act").text() || null,
          scheduled:
            elementObj.parent().parent().find(".wtt .dep").text() || null,
        },
        //stopsHere
        elementObj.siblings(".pass").length == 0
      );
    } else {
      return null;
    }
  }
}

function stationObject(name, code, arrival, platform, departure, stopsHere) {
  return {
    name: name,
    code: code,
    arrival: arrival,
    platform: platform,
    departure: departure,
    stopsHere: stopsHere,
  };
}
function getStationNameAndCode(stationString) {
  const match = stationString.match(/^(.+?)(?:\s(\[\w+\]))?$/);
  if (!match) {
    // console.error("Failed to match station string:", stationString);
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
      destination: destination,
      delay: delay,
    },
    hidden: {
      update_type: update_type,
      action: action,
    },
  };
}
function errorObject(errorString, errorDetails) {
  return {
    body: {
      error: errorString,
      details: errorDetails,
    },
    hidden: {
      update_type: "error",
      action: "end",
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
  errorObject,
};
