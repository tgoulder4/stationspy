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
    destination: recordInfo["body"];
  };
  hidden: {
    update_type: string;
    action: string;
  };
};
export type error = {
  body: {
    error: string;
    details: string;
  };
  hidden: {
    update_type: "error";
    action: "end";
  };
};
