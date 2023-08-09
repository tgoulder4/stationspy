require("dotenv").config();
const { trackTrain } = require("./trackTrain.js");
const findTrains = require("./findTrains.js");
const { atPlatform } = require("../tests/testData/transit/transitData.js");

const services = await findTrains("EUS");
services.forEach((service) => {
  if (service.destination == "Manchester Piccadilly") {
    trackTrain(service.serviceID).then((emitter) => {
      emitter.on("journeyUpdate", (update) => console.log(update));
      emitter.on("errorUpdate", (data) => console.log(data));
    });
  }
});
// trackTrain("P70052").then((emitter) => {
//   emitter.on("journeyUpdate", (data) => console.log(data));
//   emitter.on("errorUpdate", (data) => console.log(data));
// });
