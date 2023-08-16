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
exports.getCurrentState = exports.variables = exports.locationListExists = exports.getCallingPoints = exports.findAction = exports.getRecordObj = exports.badgeExists = exports.destinationReached = exports.originExists = exports.getHTML = exports.trackTrain = void 0;
const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const EventEmitter = require("events");
const equal = require("deep-equal");
const getInfo_1 = require("./getInfo");
const console_1 = require("console");
/**
 * FOR PROD: Module.exports this only. Returns an emitter promise for live train updates.
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
class TrackTrain {
    constructor() {
        this.date = getCurrentDayTime("YYYY-MM-DD");
    }
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
function findAction(locationList) {
    //returns null when
    //there could be a status
    const badge = locationList.find(".platint");
    //if there is a badge
    if (badge.length != 0) {
        return badge;
    }
    const lastArrAct = locationList.find(".arr.act").last();
    const lastArrActDepActSibling = lastArrAct.siblings(".dep.act");
    let actualMovement;
    //if there is an arrival
    if (lastArrAct.length) {
        //if there is a departure sibling
        if (lastArrActDepActSibling.length) {
            //the movement is this departure sibling
            actualMovement = lastArrActDepActSibling;
        }
        else {
            //the movement is this arrival
            actualMovement = lastArrAct;
        }
    }
    else {
        actualMovement = locationList.find(".dep.act").last();
    }
    if (actualMovement.length != 0) {
        return actualMovement;
    }
    return null; //no movement
}
exports.findAction = findAction;
function getCallingPoints($, lastActioned, destination) {
    if (lastActioned) {
        //const callingPoints = select every element with the class '.location.call.public' from lastActioned until and including the last element with the class '.location.call.public'
        const callingPoints = lastActioned
            .nextUntil(destination)
            .filter(".location.call.public");
        if (callingPoints.length == 0) {
            return null;
        }
        let callPoints = [];
        callingPoints.each((i, el) => {
            callPoints.push((0, getInfo_1.getInfo)($(el)).body);
        });
        callPoints.push((0, getInfo_1.getInfo)(destination).body);
        return callPoints;
    }
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
    const records = $(".location.call.public");
    const firstDepExp = $(".dep.exp").first();
    const locationList = $(".locationlist");
    const lastArrAct = $(".arr.act").last();
    const lastDepExp = $(".dep.act").last();
    const lastArrExp = $(".arr.exp").last();
    let origin = null;
    if (firstDepAct.length != 0 && firstDepExp.length != 0) {
        origin = getRecordObj(firstDepAct.length ? firstDepAct : firstDepExp);
    }
    else {
        origin = null;
    }
    const lastActioned = getRecordObj(findAction(locationList));
    let destination;
    if (lastArrAct.length != 0 || lastArrExp.length != 0) {
        destination = getRecordObj(lastArrExp.length ? lastArrExp : lastArrAct);
    }
    else {
        destination = null;
    }
    const callingPoints = getCallingPoints($, lastActioned, destination);
    return {
        firstDepAct: firstDepAct,
        records: records,
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
    //if no locationlist
    if (!locationListExists($)) {
        return errorObject("Error", "locationlist element not found. Check service ID.");
    }
    const { origin, lastActioned, destination, callingPoints } = (0, exports.variables)($);
    let dest;
    //if destination reached
    if (destination) {
        dest = (0, getInfo_1.getInfo)(destination);
        if (destinationReached(lastActioned, destination)) {
            return stateObject("Reached destination", dest.body, "end", callingPoints);
        }
    }
    //if no origin
    if (!origin) {
        return errorObject("No route. (Service cancelled?)", $(".callout p").text());
    }
    //if no lastActioned
    if (!lastActioned) {
        return stateObject("Not departed", (0, getInfo_1.getInfo)(origin).body, "continue", callingPoints);
    }
    //if there's a badge
    if (badgeExists(lastActioned)) {
        const lastA = (0, getInfo_1.getInfo)(lastActioned);
        (0, console_1.log)(`lastA: ${lastA}`);
        return stateObject(lastA.hidden.badgeText, lastA.body, "continue", callingPoints);
    }
    //if a departure element exists
    const isDeparture = lastActioned.find(".dep.act").length != 0;
    const isArrival = lastActioned.find(".arr.act").length != 0;
    //if arr,dep,stopshere
    if (isArrival && isDeparture && lastActioned.find(".pass").length == 0) {
        return stateObject("Departed", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    //if dep,!stopshere
    if (isDeparture && !isArrival && lastActioned.find(".pass").length != 0) {
        return stateObject("Passed", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    //if dep, !stopshere
    if (!isArrival && !isDeparture && lastActioned.find(".pass").length != 0) {
        return stateObject("Departed - No report", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
    }
    //if !arr, !dep !stopshere
    return stateObject("Passed - No report", (0, getInfo_1.getInfo)(lastActioned).body, "continue", callingPoints);
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
    emitter.emit(`${stateUpdate.hidden.update_type}Update`, stateUpdate.body);
}
