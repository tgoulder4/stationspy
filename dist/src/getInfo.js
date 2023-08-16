"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfo = exports.parseStationNameAndCode = exports.getDelay = void 0;
//UNIT TESTS
function getDelay(record) {
    if (record.find(".delay.nil").length != 0) {
        return 0;
    }
    if (record.find(".delay.rt").length != 0) {
        return parseInt(record.find(".delay").text());
    }
    return 0;
}
exports.getDelay = getDelay;
function parseStationNameAndCode(stationString) {
    if (!stationString) {
        throw new Error("stationString was null");
    }
    const match = stationString.match(/^(.+?)(?:\s(\[\w+\]))?$/);
    if (match) {
        const name = match[1].split(/\s{2,}/).join(" ");
        return {
            name: name,
            code: match[2] || null,
        };
    }
    return {
        name: "",
        code: null,
    };
}
exports.parseStationNameAndCode = parseStationNameAndCode;
function getInfo(record) {
    const { name, code } = parseStationNameAndCode(record
        .find(".name")
        .clone() //clone the element
        .children() //select all the children
        .remove() //remove all the children
        .end() //again go back to selected element
        .text()
        .trim());
    const arrExpValue = record.find(".arr.exp");
    const arrActValue = record.find(".arr.act");
    const depExpValue = record.find(".dep.exp");
    const depActValue = record.find(".dep.act");
    const arrValueExists = arrExpValue.length != 0 || arrActValue.length != 0;
    const depValueExists = depExpValue.length != 0 || depActValue.length != 0;
    let platform;
    if (record.find(".platform").text().length != 0) {
        platform = record.find(".platform").text();
    }
    else {
        platform = null;
    }
    const delay = getDelay(record);
    const stopsHere = record.find(".pass").length == 0;
    let commonBodyData = {
        name: name,
        code: code,
        platform: platform,
        stopsHere: stopsHere,
        delay: delay,
    };
    //if no dep values
    if (arrValueExists && depValueExists) {
        commonBodyData = Object.assign(Object.assign({}, commonBodyData), { arrival: {
                actual: arrActValue.length ? arrActValue.text().trim() : null,
                scheduled: arrExpValue.length
                    ? arrExpValue.text().trim()
                    : record.find(".wtt .arr").text().trim(),
            }, departure: {
                actual: depActValue.length ? depActValue.text().trim() : null,
                scheduled: depExpValue.length
                    ? depExpValue.text().trim()
                    : record.find(".wtt .dep").text().trim(),
            } });
    }
    if (!arrValueExists && depValueExists) {
        //return without departure
        commonBodyData = Object.assign(Object.assign({}, commonBodyData), { arrival: {
                actual: null,
                scheduled: null,
            }, departure: {
                actual: depActValue.length ? depActValue.text().trim() : null,
                scheduled: depExpValue.length
                    ? depExpValue.text().trim()
                    : record.find(".wtt .dep").text().trim(),
            } });
    }
    if (arrValueExists && !depValueExists) {
        commonBodyData = Object.assign(Object.assign({}, commonBodyData), { arrival: {
                actual: arrActValue.length ? arrActValue.text().trim() : null,
                scheduled: arrExpValue.length
                    ? arrExpValue.text().trim()
                    : record.find(".wtt .arr").text().trim(),
            }, departure: {
                actual: null,
                scheduled: null,
            } });
    }
    if (!arrValueExists && !depValueExists) {
        commonBodyData = Object.assign(Object.assign({}, commonBodyData), { arrival: {
                actual: null,
                scheduled: null,
            }, departure: {
                actual: null,
                scheduled: null,
            } });
    }
    let hiddenData;
    if (record.find(".platint").length) {
        hiddenData = {
            badgeText: record.find(".platint").text(),
        };
    }
    else {
        hiddenData = {
            badgeText: "",
        };
    }
    return { body: commonBodyData, hidden: hiddenData };
}
exports.getInfo = getInfo;
