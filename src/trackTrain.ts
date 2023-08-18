const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
import { getInfo } from "./getInfo";
import { error, state, recordInfo } from "./types/types";
/**
 * FOR PROD: Module.exports this only. Returns an emitter promise for live train updates.
 * @param {string} serviceID
 * @param {string} date The date of the service in YYYY-MM-DD format
 * @param {number} timeTillRefresh The time in ms between each refresh. Minimum 5000ms.
 */
export async function trackTrain(
  serviceID: string,
  date = "2023-08-16", //getCurrentDayTime("YYYY-MM-DD"),
  timeTillRefresh = 5000
) {
  if (timeTillRefresh < 5000) {
    timeTillRefresh = 5000;
  }
  let previousState: state | error;
  let currentState: state | error;
  if (!serviceID) {
    return "Enter a service ID.";
  }
  const trainUpdateEmitter = new EventEmitter();
  //loop here every 5s. 'const loop =' needed for strange js behaviour
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
//UNIT TESTS
export async function getHTML(
  serviceID: string,
  date: string
): Promise<string> {
  //get real data
  let response = await fetch(
    `https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${date}/detailed`
  );
  let html = await response.text();
  return html;
}
export function originExists(origin: cheerio.Cheerio | null) {
  if (origin == null) {
    return false;
  }
  return true;
}
export function destinationReached(
  lastActioned: cheerio.Cheerio | null,
  destination: cheerio.Cheerio | null
) {
  if (lastActioned?.find(".name").text() == destination?.find(".name").text()) {
    return true;
  }
  return false;
}
export function badgeExists(lastActioned: cheerio.Cheerio) {
  if (lastActioned.find(".platint").length != 0) {
    return true;
  }
  return false;
}
export function getRecordObj(
  someLocationChild: cheerio.Cheerio | null
): cheerio.Cheerio | null {
  if (someLocationChild) {
    return someLocationChild.parents(".location").last();
  }
  return null;
}
//-here-
export function findAction(
  locationList: cheerio.Cheerio
): cheerio.Cheerio | null {
  let action: cheerio.Cheerio | null;
  const lastActualValue = locationList.find(".act").last();
  const lastNoReport = locationList.find(".noreport").last();
  const badge = locationList.find(".platint");

  if (badge.length != 0) {
    return badge;
  }
  if (lastActualValue.length != 0) {
    return lastActualValue;
  }
  if (lastNoReport.length != 0) {
    return lastNoReport;
  }
  return null;
}
export function getCallingPoints(
  $: cheerio.Root,
  lastActioned: cheerio.Cheerio | null,
  destination: cheerio.Cheerio | null
): Array<recordInfo["body"]> | null {
  if (lastActioned) {
    //const callingPoints = select every element with the class '.location.call.public' from lastActioned until and including the last element with the class '.location.call.public'
    const callingPoints: cheerio.Cheerio = lastActioned
      .nextUntil(destination!)
      .filter(".location.call.public");
    if (callingPoints.length == 0) {
      return null;
    }
    let callPoints: Array<recordInfo["body"]> = [];
    callingPoints.each((i, el) => {
      callPoints.push(getInfo($(el)).body);
    });
    callPoints.push(getInfo(destination!).body);
    return callPoints;
  }
  return null;
}
export function locationListExists($: cheerio.Root) {
  if ($(".locationlist").length == 0) {
    return false;
  }
  return true;
}
export const variables = function ($: cheerio.Root) {
  const firstDepAct = $(".dep.act").first();
  const firstDepExp = $(".dep.exp").first();
  const locationList = $(".locationlist");
  const lastArrAct: cheerio.Cheerio = $(".arr.act").last();
  const lastDepExp: cheerio.Cheerio = $(".dep.exp").last();
  const lastArrExp = $(".arr.exp").last();
  let origin: cheerio.Cheerio | null = null;
  if (firstDepAct.length != 0 || firstDepExp.length != 0) {
    origin = getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp);
  } else {
    origin = null;
  }
  const lastActioned: cheerio.Cheerio | null = getRecordObj(
    findAction(locationList)
  );
  let destination: cheerio.Cheerio | null;
  if (lastArrAct.length != 0 || lastArrExp.length != 0) {
    destination = getRecordObj(lastArrExp.length ? lastArrExp : lastArrAct);
  } else {
    destination = null;
  }
  const callingPoints: Array<recordInfo["body"]> | null = getCallingPoints(
    $,
    lastActioned,
    destination
  );

  return {
    firstDepAct: firstDepAct,
    firstDepExp: firstDepExp,
    lastDepExp: lastDepExp,
    locationList: locationList,
    lastArrAct: lastArrAct,
    lastArrExp: lastArrExp,
    origin: origin,
    destination: destination,
    lastActioned: lastActioned,
    callingPoints: callingPoints,
  };
};
//END UNIT TESTS
//get state of train given html cheerio object
export function getCurrentState($: cheerio.Root): state | error {
  //if no locationlist
  if (!locationListExists($)) {
    return errorObject(
      "Error",
      "locationlist element not found. Check service ID."
    );
  }
  const { origin, lastActioned, destination, callingPoints } = variables($);
  let dest: recordInfo;
  //if destination reached
  if (destination) {
    dest = getInfo(destination!);
    if (destinationReached(lastActioned, destination)) {
      return stateObject(
        "Reached destination",
        dest.body,
        "end",
        callingPoints
      );
    }
  }
  //if no origin
  if (!origin) {
    return errorObject(
      "Null origin. (Service cancelled?)",
      $(".callout p").text()
    );
  }
  //if no lastActioned
  if (!lastActioned) {
    return stateObject(
      "Not departed",
      getInfo(origin).body,
      "continue",
      callingPoints
    );
  }
  //if there's a badge
  if (badgeExists(lastActioned)) {
    const lastA = getInfo(lastActioned);
    return stateObject(
      lastA.hidden.badgeText,
      lastA.body,
      "continue",
      callingPoints
    );
  }
  //if a departure element exists
  const isDeparture = lastActioned.find(".dep.act").length != 0;
  const isArrival = lastActioned.find(".arr.act").length != 0;
  //if arr,dep,stopshere
  if (isArrival && isDeparture && lastActioned.find(".pass").length == 0) {
    return stateObject(
      "Departed",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  //if dep,!stopshere
  if (isDeparture && !isArrival && lastActioned.find(".pass").length != 0) {
    return stateObject(
      "Passed",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  //if dep, !stopshere
  if (!isArrival && !isDeparture && lastActioned.find(".pass").length != 0) {
    return stateObject(
      "Departed - No report",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  //if !arr, !dep !stopshere
  return stateObject(
    "Passed - No report",
    getInfo(lastActioned).body,
    "continue",
    callingPoints
  );
}
function stateObject(
  _status: string,
  _station: recordInfo["body"],
  _action: string,
  _callingPoints?: Array<recordInfo["body"]> | null
): state {
  return {
    body: {
      status: _status,
      station: _station,
      callingPoints: _callingPoints,
    },
    hidden: {
      update_type: "journey",
      action: _action,
    },
  };
}
//update to train state
function emitUpdate(emitter: typeof EventEmitter, stateUpdate: state | error) {
  //if it's a journey update
  emitter.emit(`${stateUpdate.hidden.update_type}Update`, stateUpdate.body);
}
