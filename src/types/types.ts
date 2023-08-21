type Timing = {
  actual?: string | null;
  scheduled: string | null;
};
export type Location = {
  longitude: Number;
  latitude: Number;
};
export type Departure = {
  serviceID: string;
  destination: string;
  arrival: Timing;
  departure: Timing;
  platform: string;
  stopsHere: boolean;
  state: state["body"] | null;
};

export type stationResponse = {
  name: string;
  code: string | null;
  location: Location;
  departures: Array<Departure>;
};
export type recordInfo = {
  body: {
    name: string;
    code: string | null;
    location: Location | null;
    arrival?: Timing;
    platform?: string;
    delay?: number;
    departure?: Timing;
    stopsHere?: boolean;
  };
  hidden: {
    badgeText: string;
  };
};
export type state = {
  body: {
    status: string;
    station: recordInfo["body"];
    // nextStations: nextStations,
    callingPoints?: Array<recordInfo["body"]> | null;
  };
  hidden: {
    update_type: string;
    action: string;
  };
};
export type information = {
  body: {
    information: string;
    details: string | object;
  };
  hidden: {
    update_type: "information";
    action: "end";
  };
};
export function createInformationResponse(
  information: string,
  details: string | object
): information {
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
export function createInformationBodyResponse(
  information: string,
  details: string | object
): information["body"] {
  return {
    information,
    details,
  };
}
export function createDeparture(
  UID: string,
  destination: string,
  arrival: Timing,
  departure: Timing,
  platform: string,
  stopsHere: boolean,
  currentTrainState: state["body"] | null
): Departure {
  return {
    serviceID: UID,
    destination: destination,
    arrival: arrival,
    departure: departure,
    platform: platform,
    stopsHere: stopsHere,
    state: currentTrainState,
  }
}
export function createStationResponse(
  name: string,
  code: string | null,
  location: Location,
  services: Array<Departure>
): stationResponse {
  return {
    name: name,
    code: code,
    location: location,
    departures: services,
  };
}
