const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
import { getInfo } from "./getInfo";
import { information, state, recordInfo } from "./types/types";

export async function trackOnce(
  serviceID: string,
  date = getCurrentDayTime("YYYY-MM-DD")
): Promise<state["body"] | null> {
  const html = await getHTML(serviceID, date);
  const $: cheerio.Root = cheerio.load(html);
  const firstDepAct = $(".dep.act").first();
  const firstDepExp = $(".dep.exp").first();
  let origin: cheerio.Cheerio | null = null;
  if (firstDepAct.length != 0 || firstDepExp.length != 0) {
    origin = getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp);
  } else {
    origin = null;
  }
  if (!origin || !locationListExists($)) {
    return null;
  }
  const currentState = getCurrentState($);
  return {
    status: currentState.body.status,
    station: currentState.body.station,
  };
}
/**
 * Returns an emitter promise for live train updates.
 * @param {string} serviceID
 * @param {string} date The date of the service in YYYY-MM-DD format
 * @param {number} timeTillRefresh The time in ms between each refresh. Minimum 5000ms.
 */
export async function trackTrain(
  serviceID: string,
  date = getCurrentDayTime("YYYY-MM-DD"),
  timeTillRefresh = 5000
): Promise<typeof EventEmitter | information["body"]> {
  if (timeTillRefresh < 5000) {
    timeTillRefresh = 5000;
  }
  let previousState: state | information;
  let currentState: state | information;
  const trainUpdateEmitter = new EventEmitter();
  //loop here every 5s. 'const loop =' needed for strange js behaviour

  const loop = setInterval(async () => {
    let html = await getHTML(serviceID, date);
    let $ = cheerio.load(html);
    const firstDepAct = $(".dep.act").first();
    const firstDepExp = $(".dep.exp").first();
    let origin: cheerio.Cheerio | null = null;
    if (firstDepAct.length != 0 || firstDepExp.length != 0) {
      origin = getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp);
    } else {
      origin = null;
    }

    if (!locationListExists($) || !serviceID || !origin) {
      emitUpdate(
        trainUpdateEmitter,
        informationObject(
          "Error",
          `${
            $(".callout p").text() ||
            $(".callout p").text() ||
            $(".callout h3").text() ||
            $(".info h3").text()
          } (Hint: Check the date. Maybe the train departed before today?)`
        )
      );
      clearInterval(loop);
    } else {
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
    }
  }, timeTillRefresh);
  return trainUpdateEmitter;
  //return the emitter for subscription
}
function informationObject(
  informationString: string,
  informationDetails: string | Object
): information {
  return {
    body: {
      information: informationString,
      details: informationDetails,
    },
    hidden: {
      update_type: "information",
      action: "end",
    },
  };
}
//2-now-tracking

// trainUpdateEmitter.emit(
//   "information",
//   informationObject("Now tracking", {
//     serviceUID: serviceID,
//     date: date,
//     operator: $(".toc div").text() ? $(".toc div").text() : null,
//     class:
//       $(".callout.infopanel")
//         .text()
//         .match(/Class (\d+)/)?.[1] ||
//       $(".callout.infopanel")
//         .text()
//         .match(/Operated with (\d+)/)?.[1] ||
//       null,
//   })
// );
// if ($(".callout.primary").length != 0 || $(".callout.alert").length != 0) {
//   trainUpdateEmitter.emit(
//     "information",
//     informationObject(
//       "Notice",
//       $(".callout.primary").text() || $(".callout.alert").text()
//     )
//   );
// }
//UNIT TESTS

//TODO: CHANGE TO GETHTMLTEXT, getHTML(URLString)
export async function getHTML(
  serviceID: string,
  date: string
): Promise<string> {
  //get real data
  try {
    let response = await fetch(
      `https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${date}/detailed`
    ); //why is the status code 404??
    let html = await response.text();
    // let html: string = await response.text();
    return html;
  } catch (error) {
    console.error(error);
    return "";
  }
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
  const lastActualValue = locationList.find(".act").last();
  const lastNoReport = locationList.find(".noreport").last();
  const badge = locationList.find(".platint");

  if (badge.length != 0) {
    // console.log("BADGE FOUND");
    return badge;
  }
  if (lastActualValue.length != 0) {
    // console.log(`LASTACTUALVALUE: ${lastActualValue} FOUND`);
    return lastActualValue;
  }
  if (lastNoReport.length != 0) {
    // console.log("LASTNOREPORT FOUND");
    return lastNoReport;
  }
  return null;
}
export function getCallingPoints(
  $: cheerio.Root,
  lastActioned: cheerio.Cheerio | null,
  destination: cheerio.Cheerio | null
): Array<recordInfo["body"]> | null {
  let callingPoints: cheerio.Cheerio;
  if (lastActioned) {
    callingPoints = lastActioned.nextAll();
  } else {
    callingPoints = $(".location.call");
  }
  if (callingPoints.length == 0) {
    // console.log("NO CALLING POINTS FROM DOM");
    return null;
  }
  let callPoints: Array<recordInfo["body"]> = [];
  callingPoints.each((i, el) => {
    callPoints.push(getInfo($(el)).body);
  });
  return callPoints;
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
  // console.log(`LASTACTIONED: ${lastActioned}`);
  let destination: cheerio.Cheerio | null = $(".realtime .arr").last().length
    ? getRecordObj($(".realtime .arr").last())
    : $(".realtime.arr").slice(1).last().length
    ? getRecordObj($(".realtime.arr").slice(1).last())
    : null;
  // console.log(`DESTINATION: ${destination}`);
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
export function getCurrentState($: cheerio.Root): state {
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
  const isActualDeparture = lastActioned.find(".dep.act").length != 0;
  const isActualArrival = lastActioned.find(".arr.act").length != 0;
  const noReport = lastActioned.find(".noreport").length != 0;
  const passStation = lastActioned.find(".pass").length != 0;
  //if arr,dep,stopshere
  if (isActualArrival && isActualDeparture) {
    return stateObject(
      "Departed",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  //if arr,dep,stopshere
  if (isActualArrival && !isActualDeparture) {
    return stateObject(
      "At platform",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  //if dep,!stopshere
  if (passStation) {
    return stateObject(
      "Passed",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  //if dep, !stopshere
  if (passStation && noReport) {
    return stateObject(
      "Passed - No report",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  if (noReport && !passStation) {
    return stateObject(
      "Departed - No report",
      getInfo(lastActioned).body,
      "continue",
      callingPoints
    );
  }
  return stateObject("N/A - Not departed?", getInfo(lastActioned).body, "end");
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
function emitUpdate(
  emitter: typeof EventEmitter,
  stateUpdate: state | information
) {
  //if it's a journey update
  emitter.emit(stateUpdate.hidden.update_type, stateUpdate.body);
}
