# trainspy

Get departures at any UK train station & recieve updates on trains throughout their journey via a custom made Realtimetrains web scraper.

## Install trainspy

```js
npm i trainspy
```

# Find trains by station

Departures can be retrieved by a station's name or code:

```js
findTrains("WLF") || findTrains("Whittlesford Parkway");
```

which returns in the following format:

```js
[
  {
    destination: "Cambridge",
    departure: { actual: "2259", scheduled: "2259" },
    serviceID: "L14119",
  },
];
```

# Tracking a train

```js
trackTrain(serviceID, date, timeTillRefresh?) //date in form YYYY-MM-DD, defaults to today
```

You first need the `serviceID`.
Can be retrived by `findTrains(station)` as shown above.

## Track a service

ServiceID `P70052` departing on 18/08/2023:

```js
trackTrain("P70052", "2023-08-18").then((emitter) => {
  emitter.on("journeyUpdate", (data) => {
    //your code for journey updates, in terms of data
  });
  emitter.on("errorUpdate", (data) => console.log(data));
});
```

`trackTrain` returns a promise - `emitter`. Subscribe as shown above.
This emits live updates (as Objects) on the train until the journey is complete.

```js
{
  status: 'At Platform',
  station: {
    name: 'Stratford Parkway',
    code: 'STY',
    platform: null,
    stopsHere: true,
    delay: 0,
    arrival: { actual: '1437', scheduled: '1437' },
    departure: { actual: null, scheduled: '1438' }
  },
  callingPoints: [
    {
      name: 'Stratford-upon-Avon',
      code: 'SAV',
      platform: '2',
      stopsHere: true,
      delay: 0,
      arrival: { actual: null, scheduled: '1445' },
      departure: { actual: null, scheduled: null }
    }
  ]
}
```

| Status      | Explanation                                         |
| ----------- | --------------------------------------------------- |
| Passed      | Train just passed this non-stopping station         |
| Approaching | Train is now approaching this station               |
| Arriving    | Train is now arriving at this stopping station      |
| At platform | Train is now at a platform of this stopping station |
| Departed    | Train just departed this stopping station           |

## More examples

Track the next service from London to Manchester, today:

```js
import { trackTrain, findTrains } from "trainspy";

const services = await findTrains("EUS");
services.forEach((service) => {
  if (service.destination == "Manchester Piccadilly") {
    trackTrain(service.serviceID).then((emitter) => {
      emitter.on("journeyUpdate", (update) => console.log(update));
      emitter.on("errorUpdate", (data) => console.log(data));
    });
  }
});
```

Basic react implementation

```js
import {trackTrain} from "trainspy";

class trainInformationComponent extends Component {
  state = {
    Status: '',
    Station:''
  };

  trackTrain("P56592").then(emitter=>{
    emitter.on("journey",(update)=>{
      handleInfoChange(update);
    })
  });

  handleInfoChange = (newData) => {
    const newStatus = data.status;
    const newStation = data.station.name;
    this.setState({
      Status: newStatus,
      Station: newStation
    });
  }

  render() {
    return (
      <>
      <title>Tracking service P56592</title>
      <label>Status: {state.Status}</label>
      <label>Station: {state.station.name}</label>
      </>
    );
  }
};
```
