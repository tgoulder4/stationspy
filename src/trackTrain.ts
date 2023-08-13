const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
import getInfo from "./getInfo";
import { error, state, recordInfo } from "./types/types";
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
export async function getHTML(serviceID, date): Promise<string> {
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
  lastActioned: cheerio.Cheerio,
  destination: cheerio.Cheerio
) {
  if (lastActioned.find(".name").text() == destination.find(".name").text()) {
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
export function findAction(
  locationList: cheerio.Cheerio
): cheerio.Cheerio | null {
  //there could be a status
  const badge: cheerio.Cheerio = locationList.find(".platint");
  const actualMovement: cheerio.Cheerio = locationList.find(".dep.act").length
    ? locationList.find(".dep.act").last()
    : locationList.find(".arr.act").last();
  //if there is a badge
  if (badge.length != 0) {
    return badge;
  }
  if (actualMovement.length != 0) {
    return actualMovement;
  }
  return null; //no movement
}
export function locationListExists($: cheerio.Root) {
  if ($(".locationlist").length == 0) {
    return false;
  }
  return true;
}
export const variables = function ($: cheerio.Root) {
  const firstDepAct = $(".dep.act").first();
  const records = $(".location.call.public");
  const firstDepExp = $(".dep.exp").first();
  const locationList = $(".locationlist");
  const lastArrAct = $(".arr.act").last();
  const lastArrExp = $(".arr.exp").last();
  let origin: cheerio.Cheerio | null;
  if (firstDepAct.length != 0 && firstDepExp.length != 0) {
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
  return {
    firstDepAct: firstDepAct,
    records: records,
    firstDepExp: firstDepExp,
    locationList: locationList,
    lastArrAct: lastArrAct,
    lastArrExp: lastArrExp,
    origin: origin,
    destination: destination,
    lastActioned: lastActioned,
  };
};
//END UNIT TESTS
//get state of train given html cheerio object
function getCurrentState($: cheerio.Root): state | error {
  //if no locationlist
  if (!locationListExists($)) {
    return errorObject(
      "Error",
      "locationlist element not found. Check service ID."
    );
  }
  const { origin, lastActioned, destination } = variables($);
  //if no origin
  if (!origin || !destination) {
    return errorObject("No route.\n", $(".callout").text());
  }
  //if no lastActioned
  if (!lastActioned) {
    return stateObject(
      "Not departed",
      getInfo(origin!).body,
      getInfo(destination!).body,
      "continue"
    );
  }
  //if destination reached
  if (destinationReached(lastActioned, destination)) {
    const dest = getInfo(destination!);
    return stateObject("Reached destination", dest.body, dest.body, "end");
  }
  //if there's a badge
  if (badgeExists(lastActioned)) {
    const lastA = getInfo(lastActioned);
    return stateObject(
      lastA.hidden.badgeText,
      lastA.body,
      getInfo(destination).body,
      "continue"
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
  if (isArrival && isDeparture && lastActioned!.find(".pass").length == 0) {
    return stateObject(
      "Departed",
      getInfo(lastActioned).body,
      getInfo(destination).body,
      "continue"
    );
  }
  //if dep,!stopshere
  if (isDeparture && !isArrival && lastActioned.find(".pass").length != 0) {
    return stateObject(
      "Passed",
      getInfo(lastActioned).body,
      getInfo(destination).body,
      "continue"
    );
  }
  //if dep, !stopshere
  if (!isArrival && !isDeparture && lastActioned.find(".pass").length != 0) {
    return stateObject(
      "Departed - No report",
      getInfo(lastActioned).body,
      getInfo(destination).body,
      "continue"
    );
  }
  if (!isArrival && !isDeparture && lastActioned.find(".pass").length == 0) {
    return stateObject(
      "Passed - No report",
      getInfo(lastActioned).body,
      getInfo(destination).body,
      "continue"
    );
  }
}
function stateObject(
  _status: string,
  _station: recordInfo["body"],
  _destination: recordInfo["body"],
  _action: string
): state {
  return {
    body: {
      status: _status,
      station: _station,
      destination: _destination,
    },
    hidden: {
      update_type: "journey",
      action: _action,
    },
  };
}
//update to train state
function emitUpdate(emitter, stateUpdate) {
  //if it's a journey update
  emitter.emit(`${stateUpdate.hidden.update_type}Update`, stateUpdate.body);
}
