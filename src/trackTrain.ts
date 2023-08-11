const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
type Timing = {
  actual: string;
  scheduled: string;
};
/**
 * Object describing a record entry
 */
type InfoObject = {
  name: string;
  code: string;
  arrival: Timing;
  platform: string;
  delay: string;
  departure: Timing;
};
type InfoObject_withoutDep = {
  name: string;
  code: string;
  arrival: Timing;
  platform: string;
  delay: string;
};
type InfoObject_withoutArr = {
  name: string;
  code: string;
  platform: string;
  delay: string;
  departure: Timing;
};

type state = {
  body: {
    status: string;
    station: InfoObject | InfoObject_withoutArr;
    // nextStations: nextStations,
    destination: InfoObject_withoutDep;
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
function getCurrentState($): state | error {
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
  //REWORK STARTS HERE
  //
  //
  //
  //
  //
  //service not found
  if ($(".info h3").text() == "Not found") {
    //return error update
    return errorObject("Not found", "Check station code and try again.");
  }
  //train is cancelled
  if ($(".callout h4").text().length) {
    //return error update
    return errorObject(
      "This service is cancelled.",
      $(".callout p").text() || null
    );
  }
  const locationList: JQuery<any> = $(".locationlist");
  const origin: InfoObject = getInfo($(".location").first());
  //lastActioned record: cheerio obj
  /**
   * Record with last realtime action associated. Badge, departure or arrival.
   */
  const lastActioned: JQuery<any> | null = getLastActioned(locationList);
  //destination record: cheerio obj
  const destination: InfoObject_withoutDep = getDestination(
    $(".location").last()
  );
  //if lastActioned is falsy
  if (lastActioned) {
    if (!lastActioned.length) {
      //return not departed
      return {
        body: {
          status: "Not departed",
          station: origin,
          // nextStations: nextStations,
          destination: destination,
          delay: 0,
        },
        hidden: {
          update_type: "journey",
          action: "continue",
        },
      };
    }
  }
  //returns a station cheerio object

  //
  //
  //
  //
  //
  //REWORK ENDS HERE
  //OLD VERSION
  //
  //
  //
  //
  // //last actual arrival
  // let stationArrived = getStationArrived();
  // // console.log(`stationArrived: ${stationArrived}`);

  // let stationDeparted = getStationDeparted();
  // // console.log(`stationDeparted: ${stationDeparted}`);
  // const delay = getDelay();
  // let destination = {
  //   name:
  //     parseStationNameAndCode($(".location").find(".name").last().text())
  //       .name || null,
  //   code:
  //     parseStationNameAndCode($(".location").find(".name").last().text())
  //       .code || null,
  // };
  // let status = getStatus();
  // // console.log(`Status: ${status}`);

  // if (status) {
  //   let currentStation = getCurrentStation();
  //   // console.log(`CurrentStation: ${currentStation}`);
  //   if (currentStation) {
  //     //if stops here
  //     if (currentStation.stopsHere) {
  //       //it's always 'approaching'
  //       return stateObject(
  //         status,
  //         currentStation,
  //         // nextStations,
  //         destination,
  //         delay,
  //         "journey",
  //         "continue"
  //       );
  //     }
  //     if (!currentStation.stopsHere) {
  //       return stateObject(
  //         "Passing",
  //         currentStation,
  //         // nextStations,
  //         destination,
  //         delay,
  //         "journey",
  //         "continue"
  //       );
  //     }
  //   }
  // }
  // // console.log(
  // //   `Destination.name: ${destination.name}, Destination.code: ${destination.code}`
  // // );

  // let origin = {
  //   name:
  //     //first station with applicable rt info
  //     parseStationNameAndCode(
  //       $(".dep.exp").first().parent().parent().find(".name").text()
  //     ).name || null,
  //   code:
  //     parseStationNameAndCode(
  //       $(".dep.exp").first().parent().parent().find(".name").text()
  //     ).code || null,
  // };

  // //if a most recent arrival exists,
  // if (stationArrived) {
  //   //and journey complete return reached destination
  //   if (stationArrived.name == destination.name) {
  //     //return journey update
  //     return stateObject(
  //       "Reached destination",
  //       stationArrived,
  //       // null, //nextStation
  //       destination,
  //       delay,
  //       "journey",
  //       "end"
  //     );
  //   }
  //   if (stationArrived.arrival.actual && !stationArrived.departure.actual) {
  //     return stateObject(
  //       "At platform",
  //       stationArrived,
  //       // nextStations,
  //       destination,
  //       delay,
  //       "journey",
  //       "continue"
  //     );
  //   }
  // }

  // if (stationDeparted) {
  //   //if stopped there
  //   if (stationDeparted.stopsHere) {
  //     return stateObject(
  //       "Departed",
  //       stationDeparted,
  //       // nextStations,
  //       destination,
  //       delay,
  //       "journey",
  //       "continue"
  //     );
  //   }
  //   if (!stationDeparted.stopsHere) {
  //     return stateObject(
  //       "Passed",
  //       stationDeparted,
  //       // nextStations,
  //       destination,
  //       delay,
  //       "journey",
  //       "continue"
  //     );
  //   }
  // }
  // if (!stationDeparted) {
  //   return stateObject(
  //     "Not departed",
  //     origin,
  //     // nextStations,
  //     destination,
  //     delay,
  //     "journey",
  //     "continue"
  //   );
  // }
  // return "There was an error finding the train's current status.";
  // function getDelay() {
  //   //if arrived at a station,
  //   if (stationArrived) {
  //     //return the delay of that station
  //     return $(".arr.act").last().parent().siblings(".delay").text() || null;
  //   }
  //   //if departed from a station,
  //   if (stationDeparted) {
  //     //return the delay of that station
  //     return $(".dep.act").last().parent().siblings(".delay").text() || null;
  //   }
  //   return null;
  // }
  // function getStatus() {
  //   return $(".platint").text() || null;
  // }
  // function getCurrentStation() {
  //   let elementObj = $(".platint").parent().parent();
  //   const { name, code } = parseStationNameAndCode(
  //     $(".platint").siblings(".name").text()
  //   );
  //   return stationObject(
  //     //name of station
  //     name || null,
  //     //code of station
  //     code || null,
  //     //arrival of station
  //     {
  //       actual: elementObj.find(".arr.rt.act").text() || null,
  //       scheduled: elementObj.find(".wtt .arr").text() || null,
  //     },
  //     //platform
  //     {
  //       actual: elementObj.find(".platform.act").text() || null,
  //       scheduled: elementObj.find(".platform.exp").text() || null,
  //     },
  //     //departure of station
  //     {
  //       actual: elementObj.find(".dep.rt.act").text() || null,
  //       scheduled: elementObj.find(".wtt .dep").text() || null,
  //     },
  //     //stopsHere
  //     elementObj.find(".pass").length == 0
  //   );
  // }
  // function getStationDeparted() {
  //   let elementObj = $(".dep.act").last();
  //   if (elementObj.length != 0) {
  //     const { name, code } = parseStationNameAndCode(
  //       elementObj.parent().parent().find(".name").text()
  //     );
  //     return stationObject(
  //       //name of station
  //       name || null,
  //       //code of station
  //       code || null,
  //       //arrival of station
  //       {
  //         actual: elementObj.siblings(".arr.act").text() || null,
  //         scheduled:
  //           elementObj.parent().parent().find(".wtt .arr").text() || null,
  //       },
  //       //platform
  //       {
  //         actual: elementObj.parent().siblings(".platform.act").text() || null,
  //         scheduled:
  //           elementObj.parent().siblings(".platform.exp").text() || null,
  //       },
  //       //departure of station
  //       {
  //         actual: elementObj.text() || null,
  //         scheduled:
  //           elementObj.parent().parent().find(".wtt .dep").text() || null,
  //       },
  //       //stopsHere
  //       elementObj.siblings(".pass").length == 0
  //     );
  //   } else {
  //     return null;
  //   }
  // }
  // function getStationArrived() {
  //   // console.log(`.arr.act: ${$(".arr.act")}`);
  //   let elementObj = $(".arr.act").last();
  //   //if last actual arrival exists
  //   if (elementObj.length != 0) {
  //     //get the name and code
  //     const { name, code } = parseStationNameAndCode(
  //       elementObj.parent().parent().find(".name").text()
  //     );
  //     return stationObject(
  //       //name of station
  //       name || null,
  //       //code of station
  //       code || null,
  //       //arrival of station
  //       {
  //         actual: elementObj.text() || null,
  //         scheduled:
  //           elementObj.parent().parent().find(".wtt .arr").text() || null,
  //       },
  //       //platform
  //       {
  //         actual: elementObj.parent().siblings(".platform.act").text() || null,
  //         scheduled:
  //           elementObj.parent().siblings(".platform.exp").text() || null,
  //       },
  //       //departure of station
  //       {
  //         actual: elementObj.siblings(".dep.act").text() || null,
  //         scheduled:
  //           elementObj.parent().parent().find(".wtt .dep").text() || null,
  //       },
  //       //stopsHere
  //       elementObj.siblings(".pass").length == 0
  //     );
  //   } else {
  //     return null;
  //   }
  // }
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
function getInfo_withoutArr(record: JQuery<any>): InfoObject_withoutArr {
  const { name, code } = parseStationNameAndCode(record.find(".name").text());
  const schedule: JQuery<any> = record.find(".wtt");

  return {
    name: name,
    code: code,

    platform: record.find(".platform").text(),
    delay: record.find(".delay").text(),
    departure: {
      actual: record.find(".dep.act").text(),
      scheduled: record.find(".dep.exp").text() || schedule.find(".dep").text(),
    },
  };
}
function getInfo_withoutDep(record: JQuery<any>): InfoObject_withoutDep {
  const { name, code } = parseStationNameAndCode(record.find(".name").text());
  const schedule: JQuery<any> = record.find(".wtt");

  return {
    name: name,
    code: code,

    arrival: {
      actual: record.find(".arr.act").text(),
      scheduled: record.find(".arr.exp").text() || schedule.find(".arr").text(),
    },
    platform: record.find(".platform").text(),
    delay: record.find(".delay").text(),
  };
}
function getInfo(record: JQuery<any>): InfoObject {
  const { name, code } = parseStationNameAndCode(record.find(".name").text());
  const schedule: JQuery<any> = record.find(".wtt");

  return {
    name: name,
    code: code,

    arrival: {
      actual: record.find(".arr.act").text(),
      scheduled: record.find(".arr.exp").text() || schedule.find(".arr").text(),
    },
    platform: record.find(".platform").text(),
    delay: record.find(".delay").text(),
    departure: {
      actual: record.find(".dep.act").text(),
      scheduled: record.find(".dep.exp").text() || schedule.find(".dep").text(),
    },
  };
}
function getLastActioned(locationList: JQuery<any>): JQuery<any> | null {
  //there could be a status
  const badge: JQuery<any> = locationList.find(".platint");
  const actualMovement: JQuery<any> = locationList.find(".act");
  //if there is a badge
  if (badge.length != 0) {
    //return the whole location object
    return getRecordObj(badge);
  }
  //if there is movement (rt departure, arrival)
  if (actualMovement.length != 0) {
    return getRecordObj(actualMovement);
  }
  console.log(`getLastActioned returned null.`);
  return null; //no movement
}
function getRecordObj(someLocationChild) {
  return $(someLocationChild).parent(".location").last();
}
// function stationObject(name, code, arrival, platform, departure, stopsHere) {
//   return {
//     name: name,
//     code: code,
//     arrival: arrival,
//     platform: platform,
//     departure: departure,
//     stopsHere: stopsHere,
//   };
// }
function parseStationNameAndCode(stationString) {
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
  errorObject,
};
