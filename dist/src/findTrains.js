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
exports.findStationNameAndCode = void 0;
const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const util = require("util");
const types_1 = require("./types/types");
var stationLocations = require("./map/stationLocations.json");
var stationCodes = require("./map/stationCodes.json");
const trackTrain_1 = require("./trackTrain");
//method: present stations
const findStationNameAndCode = (stationNameOrCode) => {
    //if a match of 3 capital letters,
    let stationName = "";
    let stationCode = "";
    // console.log(
    //   `stationName: ${stationName}, stationCode: ${stationCode}, stationNameOrCode: ${stationNameOrCode}`
    // );
    const match = stationNameOrCode.match(/^[A-Z]{3}$/);
    if (match) {
        // console.log(`match: ${match}`);
        const jsonMatch = stationLocations[match[0]];
        if (jsonMatch) {
            stationName = stationLocations[match[0]].station_name;
            stationCode = match[0];
        }
        else {
            stationName = null;
            stationCode = null;
        }
        // console.log(`stationName: ${stationName}`);
        // console.log(`stationCode: ${stationCode}`);
    }
    else {
        stationName = stationNameOrCode;
        stationCode = stationCodes["stations"].find(station => station["Station Name"] == stationNameOrCode)["CRS Code"];
    }
    return { stationName, stationCode };
};
exports.findStationNameAndCode = findStationNameAndCode;
/**
 * Returns an emitter with live train updates
 * @param {string} stationCode Station code. E.g. 'WLF'
 * @param {string} dateOfDeparture Date of departure in YYYY-MM-DD format. Defaults to current day.
 * @param {string} timeOfDeparture Time of departure in HHmm format. Defaults to current time.
 */
function findTrains(stationNameOrCode, dateOfDeparture = getCurrentDayTime("YYYY-MM-DD"), timeOfDeparture = getCurrentDayTime("HHmm")) {
    return __awaiter(this, void 0, void 0, function* () {
        //if stationName is 3 letters, destructure from map
        const { stationName, stationCode } = (0, exports.findStationNameAndCode)(stationNameOrCode);
        // console.log(`stationName: ${stationName}, stationCode: ${stationCode}`)
        const callOutAndInfoValue = yield fetch(`https://www.realtimetrains.co.uk/search/handler?location=${stationCode}`).then((res) => res.text().then((data) => {
            const $ = cheerio.load(data);
            return { callout: $(".callout"), info: $(".info") };
        }));
        if (callOutAndInfoValue.callout.find("h3").text() ==
            "Cannot find primary location" ||
            callOutAndInfoValue.info.find("h3").text() == "Bad request" ||
            !stationNameOrCode) {
            return (0, types_1.createInformationBodyResponse)("Error", "Please enter a valid station code or the date and time entered.");
        }
        const location = {
            latitude: stationCode ? stationLocations[stationCode].latitude : null,
            longitude: stationCode ? stationLocations[stationCode].longitude : null,
        };
        const services = [];
        //rate limiter
        yield new Promise((r) => setTimeout(r, 1000));
        const res = yield fetch(`https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationCode}/${dateOfDeparture}/${timeOfDeparture}`);
        const $ = cheerio.load(yield res.text());
        for (const el of $("a.service").toArray()) {
            const service = $(el);
            const UID = service.attr("href").match(/gb-nr:(\w+)/);
            // console.log(`UID: ${UID[1]}`);
            const destination = service.find(".location.d").text();
            // console.log(`Destination: ${destination}`);
            const stopsHere = !service.hasClass("pass");
            const arrival = {
                actual: service.find(".real.a.act").text() || null,
                scheduled: service.find(".real.a.exp").text()
                    ? service.find(".real.a.exp").text()
                    : service.find(".plan.a.gbtt").text() || null,
            };
            // console.log(`Arrival: ${arrival}`);
            const departure = {
                actual: service.find(".real.d.act").text() || null,
                scheduled: service.find(".real.d.exp").text()
                    ? service.find(".real.d.exp").text()
                    : service.find(".plan.d.gbtt").text() || null,
            };
            // console.log(`Departure: ${departure}`);
            const platform = service.find(".platform.act").text()
                ? service.find(".platform.act").text()
                : service.find(".platform.exp").text()
                    ? service.find(".platform.exp").text()
                    : null;
            // console.log(`Platform: ${platform}`);
            yield new Promise((r) => setTimeout(r, 1000));
            const currentTrainState = yield (0, trackTrain_1.trackOnce)(UID[1]); //.status and .station only
            if (!service.hasClass("pass")) {
                services.push((0, types_1.createDeparture)(UID[1], destination, arrival, departure, platform, stopsHere, currentTrainState));
            }
        }
        return (0, types_1.createStationResponse)(stationName, stationCode, location, services);
    });
}
exports.default = findTrains;
