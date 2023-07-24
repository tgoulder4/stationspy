//TRAINSPY. {X} => param
//track a trains by station using rtt api
//say scheduled:dest as composite key and click link pointed to
//fetch this every step secs
//count from btm where .dep rt act != null, this is
//OR SEARCH FOR APPROACHING TAG

//every {STEP}(min 10) sec - axios lookup to
//https://www.realtimetrains.co.uk/service/gb-nr:{SERVICE NO.}/2023-07-22/detailed

const { default: axios } = require("axios");
import * as htmlparser2 from "htmlparser2";
const dom = htmlparser2.parseDocument(res.data);
//scheduled:dest as composite key
//find where above. it's parent holds the key
function findTrains(stationName) {
  return [
    getTrains(stationName).plannedArrival,
    getTrains(stationName).destination.name,
  ];
}
export default findTrains;
//test with jest

const trainLink = getTrains(station);
function selectTrain(trainID) {}
showTrains("S54756");
