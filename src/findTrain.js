import cheerio from "cheerio";
import getCurrentDayTime from "./getDayTime.js";
//method: present stations
export default async function findTrainsByStation(stationName) {
  //if stationName is the only parameter,
  const services = [];
  await fetch(
    `https://www.realtimetrains.co.uk/search/detailed/gb-nr:${stationName}/${getCurrentDayTime(
      "YYYY-MM-DD"
    )}/${getCurrentDayTime("HHmm")}`
  ).then((res) =>
    res.text().then((data) => {
      const $ = cheerio.load(data);
      $("a.service").each((i, el) => {
        //returns cheerio object as each child
        //if there are no pass stations
        const service = $(el);
        const codeMatch = service.attr("href").match(/gb-nr:(\w+)/);
        if (!service.hasClass("pass")) {
          services.push({
            destination: service.find(".location.d").text(),
            departure: {
              actual: service.find(".real.a").text(),
              scheduled: service.find(".plan.a").text(),
            },
            trainID: codeMatch[1],
          });
        }
      });
      console.log(services);
    })
  );
}
