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
const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
const types_1 = require("./types/types");
var stationLocations = require("./map/stationLocations.json");
const getInfo_1 = require("./getInfo");
//method: present stations
/**
 * Returns an emitter with live train updates
 * @param {string} stationCode Station code. E.g. 'WLF'
 * @param {string} dateOfDeparture Date of departure in YYYY-MM-DD format. Defaults to current day.
 * @param {string} timeOfDeparture Time of departure in HHmm format. Defaults to current time.
 */
function findTrains(stationCode, dateOfDeparture = getCurrentDayTime("YYYY-MM-DD"), timeOfDeparture = getCurrentDayTime("HHmm")) {
    return __awaiter(this, void 0, void 0, function* () {
        //if stationName is 3 letters, destructure from map
        const callOutAndInfoValue = yield fetch(`https://www.realtimetrains.co.uk/search/handler?location=${stationCode}`).then((res) => res.text().then((data) => {
            const $ = cheerio.load(data);
            return { callout: $(".callout"), info: $(".info") };
        }));
        if (callOutAndInfoValue.callout.find("h3").text() ==
            "Cannot find primary location" ||
            callOutAndInfoValue.callout.find("p").text() ==
                "Sorry, no services were found in the next two hours." ||
            callOutAndInfoValue.info.find("h3").text() == "Bad request" ||
            !stationCode) {
            return (0, types_1.createInformationBodyResponse)("Error", "Please enter a valid station code or the date and time entered.");
        }
        let services = [];
        const stationName = stationLocations[stationCode].station_name;
        const location = {
            latitude: stationLocations[stationCode].latitude,
            longitude: stationLocations[stationCode].longitude,
        };
        // console.log(`Location: ${location}`);
        yield fetch(`https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationCode}/${dateOfDeparture}/${timeOfDeparture}`).then((res) => res.text().then((data) => {
            const $ = cheerio.load(data);
            $("a.service").each((i, el) => __awaiter(this, void 0, void 0, function* () {
                const service = $(el);
                const UID = service.attr("href").match(/gb-nr:(\w+)/);
                console.log(`UID: ${UID[1]}`);
                const destination = service.find(".location.d").text();
                console.log(`Destination: ${destination}`);
                const stopsHere = !service.hasClass("pass");
                const arrival = {
                    actual: service.find(".real.a").text() || null,
                    scheduled: service.find(".plan.a").text() || null,
                };
                console.log(`Arrival: ${arrival}`);
                const departure = {
                    actual: service.find(".real.d").text() || null,
                    scheduled: service.find(".plan.d").text() || null,
                };
                console.log(`Departure: ${departure}`);
                const platform = service.find(".platform.act").text()
                    ? service.find(".platform.act").text()
                    : service.find(".platform.exp").text()
                        ? service.find(".platform.exp").text()
                        : null;
                console.log(`Platform: ${platform}`);
                const currentTrainLocation = (0, getInfo_1.getLocationObject)(stationCode);
                if (!service.hasClass("pass")) {
                    services.push((0, types_1.createDeparture)(UID[1], destination, arrival, departure, platform, stopsHere, currentTrainLocation));
                }
            }));
            return (0, types_1.createStationResponse)(stationName, stationCode, location, services);
        }));
    });
}
exports.default = findTrains;
