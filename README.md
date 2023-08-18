# trainspy

Get departures at any UK train station & recieve instant real-time updates on trains throughout their journey via this custom made Realtimetrains scraper.

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
trackTrain(serviceID, date?, timeTillRefresh?) //date in form YYYY-MM-DD, defaults to today
```

You first need the `serviceID`.
Can be retrived by `findTrains(station)` as shown above.

## Track a service

ServiceID `P70052` departing on 18/08/2023:

```js
trackTrain("P70052", "2023-08-18").then((emitter) => {
  emitter.on("journey", (data) => {
    //your code for journey updates, in terms of data
  });
  emitter.on("information", (data) => console.log(data));
});
```

`trackTrain` returns a promise - `emitter`. Subscribe as shown above.

This emits live updates on the train until the journey is complete:

Journey update:

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

Information update:

```js
  {
    information: 'Error', details: 'Check service ID.'
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
const serviceID = services.forEach((service) => {
  if (service.destination == "Manchester Piccadilly") {
    return service.serviceID;
  }
});
trackTrain(serviceID).then((emitter) => {
  emitter.on("journey", () => {
    //do stuff!
  });
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
      <label>Station: {state.Station.name}</label>
      </>
    );
  }
};
```
