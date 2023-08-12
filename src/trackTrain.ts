const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
import getInfo from "./getInfo";
type Timing = {
  actual: string;
  scheduled: string;
};
type recordInfo = {
  body: {
    name: string;
    code: string;
    arrival?: Timing;
    platform: string;
    delay: number;
    departure?: Timing;
    stopsHere: boolean;
  };
  hidden?: {
    badge: string;
  };
};
type state = {
  body: {
    status: string;
    station: recordInfo["body"];
    // nextStations: nextStations,
    destination: recordInfo["body"];
    delay: number;
  };
  hidden: {
    update_type: string;
    action: string;
  };
};
type error = {
  body: {
    error: string;
    details: string;
  };
  hidden: {
    update_type: "error";
    action: "end";
  };
};
/**
 * FOR PROD: Module.exports this only. Returns an emitter promise for live train updates.
 * @param {string} serviceID
 * @param {number} timeTillRefresh
 */
async function trackTrain(serviceID, timeTillRefresh = 5000) {
  let previousState: state | error;
  let currentState: state | error;
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
  let html = await response.text();
  return html;
}
//UNIT TESTS
function noAvailableRouteCheck(
  $,
  firstDepAct: JQuery<any>,
  firstDepExp: JQuery<any>
) {
  if (firstDepAct.length == 0 && firstDepExp.length == 0) {
    return true;
  }
}
function notFoundCheck($) {
  if ($(".info h3").text() == "Not found") {
    //return error update
    return true;
  }
}
function findOrigin($, firstDepAct: JQuery<any>, firstDepExp: JQuery<any>) {
  return getRecordObj($, firstDepAct.length ? firstDepAct : firstDepExp);
}
function getRecordObj($, someLocationChild: JQuery<any>): JQuery<any> {
  return $(someLocationChild).parent(".location").last();
}

function errorObject(errorString: string, errorDetails: string): error {
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
//expect tobeornotbenull only
function getActioningRecord($, locationList: JQuery<any>): JQuery<any> | null {
  //there could be a status
  const badge: JQuery<any> = locationList.find(".platint");
  const actualMovement: JQuery<any> = locationList.find(".act");
  //if there is a badge
  if (badge.length != 0) {
    //return the whole location object
    return getRecordObj($, badge);
  }
  //if there is movement (rt departure, arrival)
  if (actualMovement.length != 0) {
    return getRecordObj($, actualMovement);
  }
  console.log(`getActioningRecord returned null.`);
  return null; //no movement
}

//
//get state of train given html cheerio object
function getCurrentState($): state | error {
  //service not found
  if (notFoundCheck($)) {
    return errorObject("Not found", "Please enter a valid station code.");
  }
  //START UNIT TEST: noAvailableRouteCheck
  const firstDepAct = $(".dep.act").first();
  const firstDepExp = $(".dep.exp").first();

  if (noAvailableRouteCheck($, firstDepAct, firstDepExp)) {
    return errorObject("No available route", $(".callout").text());
  }

  const locationList: JQuery<any> = $(".locationlist");
  const origin = findOrigin($, firstDepAct, firstDepExp);
  const infoOrigin = getInfo(origin);
  const lastActioned: JQuery<any> | null = getActioningRecord($, locationList);
  const lastArrAct = $(".arr.act").last();
  const lastArrExp = $(".arr.exp").last();
  const destination = getRecordObj(
    $,
    lastArrAct.length ? lastArrAct : lastArrExp
  );
  const infoDestination: recordInfo = getInfo(destination);
  //if lastActioned is falsy
  if (!lastActioned) {
    return stateObject(
      "Not departed",
      infoOrigin.body,
      infoDestination.body,
      "continue"
    );
  }
  const infoLastActioned: recordInfo = getInfo(lastActioned);
  console.log(`infoLastActioned: ${infoLastActioned}`);
  const infoLastActionedBody = infoLastActioned.body;
  if (infoLastActionedBody.name == infoDestination.body.name) {
    return stateObject(
      "Reached destination",
      infoOrigin.body,
      infoDestination.body,
      "end",
      infoLastActionedBody.delay
    );
  }
  //if there's a badge
  if (infoLastActioned.hidden?.badge) {
    return stateObject(
      infoLastActioned.hidden.badge,
      infoLastActionedBody,
      infoDestination.body,
      "continue",
      infoLastActionedBody.delay
    );
  }
  //if a departure element exists
  const isDeparture: boolean = !!(
    infoLastActionedBody.departure?.actual ||
    infoLastActionedBody.departure?.scheduled
  );
  //if an arrival element exists
  const isArrival: boolean = !!(
    infoLastActionedBody.arrival?.actual ||
    infoLastActionedBody.arrival?.scheduled
  );
  //if arr,dep,stopshere
  if (isArrival && isDeparture && infoLastActionedBody.stopsHere) {
    return stateObject(
      "Departed",
      infoLastActionedBody,
      infoDestination.body,
      "continue",
      infoLastActioned.body.delay
    );
  }
  //if dep,!stopshere
  if (isDeparture && !infoLastActionedBody.stopsHere && !isArrival) {
    return stateObject(
      "Passed",
      infoLastActionedBody,
      infoDestination.body,
      "continue",
      infoLastActioned.body.delay
    );
  }
  //if dep, !stopshere
  if (isArrival && !infoLastActionedBody.stopsHere) {
    return stateObject(
      "Passed",
      infoLastActionedBody,
      infoDestination.body,
      "continue",
      infoLastActioned.body.delay
    );
  }
  function stateObject(
    _status: string,
    _station: recordInfo["body"],
    _destination: recordInfo["body"],
    _action: string,
    _delay?: number
  ): state {
    return {
      body: {
        status: _status,
        station: _station,
        destination: _destination,
        delay: _delay,
      },
      hidden: {
        update_type: "journey",
        action: _action,
      },
    };
  }
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
  parseStationNameAndCode,
  emitUpdate,
};
