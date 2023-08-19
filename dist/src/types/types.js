"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStationResponse = exports.createDeparture = exports.createInformationBodyResponse = exports.createInformationResponse = void 0;
function createInformationResponse(information, details) {
    return {
        body: {
            information,
            details,
        },
        hidden: {
            update_type: "information",
            action: "end",
        },
    };
}
exports.createInformationResponse = createInformationResponse;
function createInformationBodyResponse(information, details) {
    return {
        information,
        details,
    };
}
exports.createInformationBodyResponse = createInformationBodyResponse;
function createDeparture(UID, destination, arrival, departure, platform, stopsHere, currentTrainState) {
    return {
        [UID]: {
            destination: destination,
            arrival: arrival,
            departure: departure,
            platform: platform,
            stopsHere: stopsHere,
            state: currentTrainState,
        },
    };
}
exports.createDeparture = createDeparture;
function createStationResponse(name, code, location, services) {
    return {
        name: name,
        code: code,
        location: location,
        departures: services,
    };
}
exports.createStationResponse = createStationResponse;
