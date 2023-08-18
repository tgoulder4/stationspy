type Timing = {
  actual?: string | null;
  scheduled: string | null;
};
export type recordInfo = {
  body: {
    name: string;
    code: string | null;
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
