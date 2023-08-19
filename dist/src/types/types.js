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
function createDeparture(serviceID, destination, arrival, departure, platform, stopsHere, currentLocation) {
    return {
        serviceID,
        destination,
        arrival,
        departure,
        platform,
        stopsHere,
        currentLocation,
    };
}
exports.createDeparture = createDeparture;
function createStationResponse(name, code, location, services) {
    return {
        name,
        code,
        location,
        services,
    };
}
exports.createStationResponse = createStationResponse;
