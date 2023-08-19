"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentState = exports.variables = exports.locationListExists = exports.getCallingPoints = exports.findAction = exports.getRecordObj = exports.badgeExists = exports.destinationReached = exports.originExists = exports.getHTML = exports.trackTrain = exports.trackOnce = void 0;
const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
const getInfo_1 = require("./getInfo");
function trackOnce(serviceID, date = getCurrentDayTime("YYYY-MM-DD")) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield getHTML(serviceID, date);
        const $ = cheerio.load(html);
        const firstDepAct = $(".dep.act").first();
        const firstDepExp = $(".dep.exp").first();
        let origin = null;
        if (firstDepAct.length != 0 || firstDepExp.length != 0) {
            origin = getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp);
        }
        else {
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
    });
}
exports.trackOnce = trackOnce;
/**
 * Returns an emitter promise for live train updates.
 * @param {string} serviceID
 * @param {string} date The date of the service in YYYY-MM-DD format
 * @param {number} timeTillRefresh The time in ms between each refresh. Minimum 5000ms.
 */
function trackTrain(serviceID, date = getCurrentDayTime("YYYY-MM-DD"), timeTillRefresh = 5000) {
    return __awaiter(this, void 0, void 0, function* () {
        if (timeTillRefresh < 5000) {
            timeTillRefresh = 5000;
        }
        let previousState;
        let currentState;
        if (!serviceID) {
            return "Enter a service ID.";
        }
        const trainUpdateEmitter = new EventEmitter();
        //loop here every 5s. 'const loop =' needed for strange js behaviour
        const loop = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            let html = yield getHTML(serviceID, date);
            let $ = cheerio.load(html);
            //--  //if no locationlist
            if (!locationListExists($)) {
                return informationObject("Error", "Check service ID.");
            }
            const firstDepAct = $(".dep.act").first();
            const firstDepExp = $(".dep.exp").first();
            let origin = null;
            if (firstDepAct.length != 0 || firstDepExp.length != 0) {
                origin = getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp);
            }
            else {
                origin = null;
            }
            //if no origin
            if (!origin) {
                return informationObject("Null origin. (Service cancelled?)", $(".callout p").text());
            }
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
        }), timeTillRefresh);
        //return the emitter for subscription
        return trainUpdateEmitter;
    });
}
exports.trackTrain = trackTrain;
function informationObject(informationString, informationDetails) {
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
function getHTML(serviceID, date) {
    return __awaiter(this, void 0, void 0, function* () {
        //get real data
        let response = yield fetch(`https://www.realtimetrains.co.uk/service/gb-nr:${serviceID}/${date}/detailed`);
        let html = yield response.text();
        return html;
    });
}
exports.getHTML = getHTML;
function originExists(origin) {
    if (origin == null) {
        return false;
    }
    return true;
}
exports.originExists = originExists;
function destinationReached(lastActioned, destination) {
    if ((lastActioned === null || lastActioned === void 0 ? void 0 : lastActioned.find(".name").text()) == (destination === null || destination === void 0 ? void 0 : destination.find(".name").text())) {
        return true;
    }
    return false;
}
exports.destinationReached = destinationReached;
function badgeExists(lastActioned) {
    if (lastActioned.find(".platint").length != 0) {
        return true;
    }
    return false;
}
exports.badgeExists = badgeExists;
function getRecordObj(someLocationChild) {
    if (someLocationChild) {
        return someLocationChild.parents(".location").last();
    }
    return null;
}
exports.getRecordObj = getRecordObj;
//-here-
function findAction(locationList) {
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
exports.findAction = findAction;
function getCallingPoints($, lastActioned, destination) {
    if (lastActioned) {
        const callingPoints = lastActioned.nextAll();
        if (callingPoints.length == 0) {
            // console.log("NO CALLING POINTS FROM DOM");
            return null;
        }
        let callPoints = [];
        callingPoints.each((i, el) => {
            callPoints.push((0, getInfo_1.getInfo)($(el)).body);
        });
        // console.log("RETURNING CALLPOINTS");
        return callPoints;
    }
    // console.log("NO LASTACTIONED");
    return null;
}
exports.getCallingPoints = getCallingPoints;
function locationListExists($) {
    if ($(".locationlist").length == 0) {
        return false;
    }
    return true;
}
exports.locationListExists = locationListExists;
const variables = function ($) {
    const firstDepAct = $(".dep.act").first();
    const firstDepExp = $(".dep.exp").first();
    const locationList = $(".locationlist");
    const lastArrAct = $(".arr.act").last();
    const lastDepExp = $(".dep.exp").last();
    const lastArrExp = $(".arr.exp").last();
    let origin = null;
    if (firstDepAct.length != 0 || firstDepExp.length != 0) {
        origin = getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp);
    }
    else {
        origin = null;
    }
    const lastActioned = getRecordObj(findAction(locationList));
    // console.log(`LASTACTIONED: ${lastActioned}`);
    let destination = $(".realtime .arr").last().length
        ? getRecordObj($(".realtime .arr").last())
        : $(".realtime.arr").slice(1).last().length
            ? getRecordObj($(".realtime.arr").slice(1).last())
            : null;
    // console.log(`DESTINATION: ${destination}`);
    const callingPoints = getCallingPoints($, lastActioned, destination);
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
exports.variables = variables;
//END UNIT TESTS
//get state of train given html cheerio object
function getCurrentState($) {
    const { origin, lastActioned, destination, callingPoints } = (0, exports.variables)($);
    let dest;
    //if destination reached
    if (destination) {
        dest = (0, getInfo_1.getInfo)(destination);
        if (destinationReached(lastActioned, destination)) {
            return stateObject("Reached destination", dest.body, "end", callingPoints);
        }
    }
    //if no lastActioned
    if (!lastActioned) {
        return stateObject("Not departed", (0, getInfo_1.getInfo)(origin).body, "continue", callingPoints);
    }
    //if there's a badge
    if (badgeExists(lastActioned)) {
        const lastA = (0, getInfo_1.getInfo)(lastActioned);
        return stateObject(lastA.hidden.badgeText, lastA.body, "continue", callingPoints);
    }
    //if a departure element exists
    const isActualDeparture = lastActioned.find(".dep.act").length != 0;
    const isActualArrival = lastActioned.find(".arr.act").length != 0;
    const noReport = lastActioned.find(".noreport").length != 0;
    const passStation = lastActioned.find(".pass").length != 0;
    //if arr,dep,stopshere
    if (isActualArrival && isActualDeparture) {
        return stateObject("Departed", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    //if arr,dep,stopshere
    if (isActualArrival && !isActualDeparture) {
        return stateObject("At platform", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    //if dep,!stopshere
    if (passStation) {
        return stateObject("Passed", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    //if dep, !stopshere
    if (passStation && noReport) {
        return stateObject("Passed - No report", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    if (noReport && !passStation) {
        return stateObject("Departed - No report", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    return stateObject("Couldn't get state.", (0, getInfo_1.getInfo)(lastActioned).body, "end");
}
exports.getCurrentState = getCurrentState;
function stateObject(_status, _station, _action, _callingPoints) {
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
function emitUpdate(emitter, stateUpdate) {
    //if it's a journey update
    emitter.emit(`${stateUpdate.hidden.update_type}`, stateUpdate.body);
}
