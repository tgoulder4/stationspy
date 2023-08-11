const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
type Timing = {
  actual: string;
  scheduled: string;
};
type recordInfo = {body: {
  name: string;
  code: string;
  arrival?: Timing;
  platform: string;
  delay: number;
  departure?: Timing;
  stopsHere: boolean;
},hidden?:{
  badge: string;
}};


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
  //cancelled train
  //dep act first or dep exp first
  const firstDepAct = $(".dep.act").first();
  const firstDepExp = $(".dep.exp").first();
  if (firstDepAct.length == 0 && firstDepExp.length == 0) {
    errorObject("This service is cancelled:", $(".callout").text());
  }
  const locationList: JQuery<any> = $(".locationlist");
  const origin = getRecordObj(firstDepAct.length? firstDepAct : firstDepExp);
  const infoOrigin: recordInfo = getInfo(origin);
  const lastActioned: JQuery<any> | null = getActioningRecord(locationList);
  const lastArrAct = $(".arr.act").last();
  const lastArrExp = $(".arr.exp").last();
  const destination: recordInfo = getInfo(getRecordObj(lastArrAct.length? lastArrAct : lastArrExp));
  //if lastActioned is falsy
  if (!lastActioned) {
    return stateObject("Not departed", origin, destination.body, infoOrigin.body.delay,"continue");
  }
  const infoLastActioned: recordInfo = getInfo(lastActioned);
  const infoLastActionedBody= infoLastActioned.body;
  if (infoLastActionedBody.name == destination.body.name){
    return stateObject("Reached destination", origin, destination.body, infoLastActionedBody.delay, "end")
  }
  //if there's a badge
  if (infoLastActioned.hidden?.badge) {
    return stateObject(
      infoLastActioned.hidden.badge,
      infoLastActionedBody,
      destination.body,
      infoLastActioned.body.delay,
      "continue"
    );
  }
  //if there's a departure
  const isDeparture:boolean = !!(infoLastActionedBody.departure?.actual || infoLastActionedBody.departure?.scheduled);
  const isArrival:boolean = !!(infoLastActionedBody.arrival?.actual || infoLastActionedBody.arrival?.scheduled);
  //if arr,dep,stopshere
  if (isArrival&&isDeparture&&infoLastActionedBody.stopsHere) {
    return stateObject(
      "Departed",
      infoLastActionedBody,
      destination.body,
      infoLastActioned.body.delay,
      "continue"
    );
  }
  //if dep,!stopshere
  if (isDeparture&&(!infoLastActionedBody.stopsHere)&&!isArrival) {
    return stateObject(
      "Passed",
      infoLastActionedBody,
      destination.body,
      infoLastActioned.body.delay,
      "continue"
    );
  }
  //if dep, !stopshere
  if(isArrival&&(!infoLastActionedBody.stopsHere)){
    return stateObject(
      "Passed",
      infoLastActionedBody,
      destination.body,
      infoLastActioned.body.delay,
      "continue"
    );
  }
  function stateObject(_status: string, _station: recordInfo["body"], _destination: recordInfo["body"], _delay: number,_action:string ): state {
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
    }
    };
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
  function getInfo(
    record: JQuery<any>
  ): recordInfo {
    const { name, code } = parseStationNameAndCode(record.find(".name").text());
    const schedule: JQuery<any> = record.find(".wtt");
    const arrExpValue = record.find(".arr.exp");
    const arrActValue = record.find(".arr.act");
    const depExpValue = record.find(".dep.exp");
    const depActValue = record.find(".dep.act");
    const noArrValue = (arrExpValue.length == 0 && arrActValue.length == 0);
    const noDepValue = (depExpValue.length == 0 && depActValue.length == 0);
    const platform = record.find(".platform").text();
    const delay = record.find(".delay").text();
    const stopsHere = record.find(".pass").length == 0;
    const commonData = {
      name: name,
      code: code,
      platform: platform,
      delay: delay,
      stopsHere: stopsHere,
    };
    if(noArrValue && noDepValue){

    }
    //if no dep values
    if (noDepValue) {
      //return without departure
      return {
        ...commonData,
        arrival: {actual: arrActValue.text(), scheduled:}
      };
    }
    //if a rt dep value but no arr value
    //if a rt arr value but no dep value
    //else return all
    if (record.find(".arr.act")) {
      //it has left origin
      return {
        ...commonData,
        departure: {
          actual: record.find(".dep.act").text(),
          scheduled:
            record.find(".dep.exp").text() || schedule.find(".dep").text(),
        },
      };
    }
  }
  function getActioningRecord(locationList: JQuery<any>): JQuery<any> | null {
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
    console.log(`getActioningRecord returned null.`);
    return null; //no movement
  }
  function getRecordObj(someLocationChild) {
    return $(someLocationChild).parent(".location").last();
  }
}
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
};
