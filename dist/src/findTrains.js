var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const cheerio = require("cheerio");
const getCurrentDayTime = require("./getDayTime");
//method: present stations
/**
 * Returns an emitter with live train updates
 * @param {string} stationName Name of the station or station code. E.g. 'WLF' or 'Whittlesford Parkway'
 */
module.exports = function findTrains(stationName) {
    return __awaiter(this, void 0, void 0, function* () {
        //if stationName is 3 letters, destructure from map
        if ((yield fetch(`https://www.realtimetrains.co.uk/search/handler?location=${stationName}`).then((res) => res.text().then((data) => {
            const $ = cheerio.load(data);
            return $(".callout.condensed h3").text();
        }))) == "Cannot find primary location" ||
            !stationName) {
            return "Please enter a valid station code.";
        }
        const services = [];
        yield fetch(`https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationName}/${getCurrentDayTime("YYYY-MM-DD")}/${getCurrentDayTime("HHmm")}`).then((res) => res.text().then((data) => {
            const $ = cheerio.load(data);
            $("a.service").each((i, el) => {
                //returns cheerio object as each child
                //if there are no pass stations
                const service = $(el);
                const UID = service.attr("href").match(/gb-nr:(\w+)/);
                if (!service.hasClass("pass")) {
                    services.push({
                        destination: service.find(".location.d").text(),
                        arrival: {
                            actual: service.find(""),
                        },
                        departure: {
                            actual: service.find(".real.a").text(),
                            scheduled: service.find(".plan.a").text(),
                        },
                        serviceID: UID[1],
                    });
                }
            });
        }));
        return services;
    });
};
