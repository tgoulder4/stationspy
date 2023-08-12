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
export function availableRouteCheck(
  $,
  firstDepAct: cheerio.Cheerio,
  firstDepExp: cheerio.Cheerio
) {
  if (firstDepAct.length == 0 && firstDepExp.length == 0) {
    return false;
  }
  return true;
}
export function journeyNotFound($) {
  if ($(".info h3").text() == "Not found") {
    //return error update
    return true;
  }
}
export function findOrigin(
  $,
  firstDepAct: cheerio.Cheerio,
  firstDepExp: cheerio.Cheerio
): cheerio.Cheerio {
  return getRecordObj($, firstDepAct.length ? firstDepAct : firstDepExp);
}
export function findDestination($, lastArrAct, lastArrExp) {
  //find last arr.act or arr.exp
  return getRecordObj($, lastArrAct.length ? lastArrAct : lastArrExp);
}
export function getRecordObj(
  $: cheerio.Root,
  someLocationChild: cheerio.Cheerio
): cheerio.Cheerio {
  return someLocationChild.parents(".location").last();
}
export function findActioning(
  $,
  locationList: cheerio.Cheerio
): cheerio.Cheerio | null {
  //there could be a status
  const badge: cheerio.Cheerio = locationList.find(".platint");
  const actualMovement: cheerio.Cheerio = locationList.find(".act").last();
  //if there is a badge
  if (badge.length != 0) {
    //return the whole location object
    return getRecordObj($, badge);
  }
  //if there is movement (rt departure, arrival)
  if (actualMovement.length != 0) {
    return getRecordObj($, actualMovement);
  }
  console.log(`findActioning returned null.`);
  return null; //no movement
}
export const getVariables = function ($: cheerio.Root) {
  return {
    firstDepAct: $(".dep.act").first(),
    firstDepExp: $(".dep.exp").first(),
    locationList: $(".locationlist"),
    lastArrAct: $(".arr.act").last(),
    lastArrExp: $(".arr.exp").last(),
  };
};
//
//get state of train given html cheerio object
function getCurrentState($: cheerio.Root): state | error {
  const { firstDepAct, firstDepExp, locationList, lastArrAct, lastArrExp } =
    getVariables($);
  //service not found
  if (journeyNotFound($)) {
    return errorObject("Not found", "Please enter a valid station code.");
  }
  //START UNIT TEST: availableRouteCheck

  if (!availableRouteCheck($, firstDepAct, firstDepExp)) {
    return errorObject("No available route", $(".callout").text());
  }

  const origin = findOrigin($, firstDepAct, firstDepExp);
  const infoOrigin = getInfo(origin);
  const lastActioned: cheerio.Cheerio | null = findActioning($, locationList);
  const destination = findDestination($, lastArrAct, lastArrExp);
  const infoDestination: recordInfo = getInfo(destination);
  const infoDestinationBody: recordInfo["body"] = infoDestination.body;
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
  const infoLastActionedBody = infoLastActioned.body;
  if (infoLastActionedBody.name == infoDestinationBody.name) {
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
      infoDestinationBody,
      "continue",
      infoLastActioned.body.delay
    );
  }
  //if dep,!stopshere
  if (isDeparture && !isArrival && !infoLastActionedBody.stopsHere) {
    return stateObject(
      "Passed",
      infoLastActionedBody,
      infoDestinationBody,
      "continue",
      infoLastActioned.body.delay
    );
  }
  //if dep, !stopshere
  if (!isArrival && !isDeparture) {
    return stateObject(
      "Cancelled",
      infoLastActionedBody,
      infoDestinationBody,
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
