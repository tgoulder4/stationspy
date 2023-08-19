# trainspy 🔍

Get departures at any UK train station & recieve instant real-time updates on trains throughout their journey via this fast & free RealTimeTrains scraper.

_Add me on discord - I'd love to hear your feedback! @tyetiesthetie_

## Install trainspy

```js
npm i trainspy
```

# Find departures

Departures can be retrieved by a station's name or code:

```js
findTrains("WLF");
```

_⚠️NOTE: Some features are unavailable with a station name. Use it's code for the best experience!_

which returns in the following format:

```js
{
  name: 'Whittlesford Parkway',
  code: 'WLF',
  location: { latitude: 52.1035981209, longitude: 0.1656457011 },
  departures: [
    {
      serviceID: 'L13825',
      destination: 'Norwich',
      arrival: { actual: '2109', scheduled: '2109' },
      departure: { actual: '2109¼', scheduled: '2109' },
      platform: '2',
      stopsHere: true,
      state: {
        status: 'Passed',
        station: {
          name: 'Waterbeach',
          code: 'WBC',
          location: { latitude: 52.2623177182, longitude: 0.1968191721 },
          platform: '2',
          stopsHere: false,
          delay: 0,
          arrival: { actual: null, scheduled: null },
          departure: { actual: '2127½', scheduled: '2128' }
        }
      }
    },
    ...]
}
```

# Tracking a train

```js
trackTrain(serviceID, date?, timeTillRefresh?) //date in form YYYY-MM-DD, defaults to today
```

You first need the `serviceID`. Retrieved by `findTrains(station)` as shown above.

## Track a service

`trackTrain` returns a promise - `emitter`.
This emits live updates on the train until the journey is complete.
E.g. ServiceID `P70052` departing on 18/08/2023:

```js
trackTrain("P70052", "2023-08-18").then((emitter) => {
  emitter.on("journey", (journeyUpdate) => {
    //your code for journey updates, in terms of 'journeyUpdate'
  });
  emitter.on("information", (infoUpdate) => console.log(infoUpdate));
});
```

_Note you must enter an event name of "journey" or "information"._

### Journey updates:

A journey update consists of the following properties:

| Property      | Type                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status        | string                                                                                                                                                                                |
| Station       | { `name`: string, `code`: string \| null, `location`: {}`stopsHere`: boolean, `delay`: number, `arrival`: { `actual`: string, `scheduled`: string }, `departure`: -same as arrival- } |
| callingPoints | Array\<Station>                                                                                                                                                                       |

```js
{
  status: 'At platform',
  station: {
    name: 'Smethwick Rolfe Street',
    code: 'SMR',
    location: { latitude: 52.4963984863, longitude: -1.9706383988 },
    platform: '2',
    stopsHere: true,
    delay: 0,
    arrival: { actual: '2146¾', scheduled: '2146½' },
    departure: { actual: null, scheduled: '2147' }
  },
  callingPoints: [
    {
      name: 'Galton Jn',
      code: 'XGJ',
      location: null,
      platform: null,
      stopsHere: false,
      delay: 0,
      arrival: { actual: null, scheduled: null },
      departure: { actual: null, scheduled: '2148' }
    },
    {
      name: 'Smethwick Galton Bridge',
      code: 'SGB',
      location: { latitude: 52.5017945032, longitude: -1.9805048854 },
      platform: null,
      stopsHere: true,
      delay: 0,
      arrival: { actual: null, scheduled: '2149' },
      departure: { actual: null, scheduled: '2150' }
    },
    {
      name: 'Sandwell & Dudley',
      code: 'SAD',
      location: { latitude: 52.508672806, longitude: -2.0115900516 },
      platform: '2',
      stopsHere: true,
      delay: 0,
      arrival: { actual: null, scheduled: '2152' },
      departure: { actual: null, scheduled: '2153' }
    },
    ...
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

### Information updates:

```js
  {
    information: 'Error', details: 'Check service ID.'
  }
```

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
  emitter.on("journey", (journeyUpdate) => {
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
    emitter.on("journey",(journeyUpdate)=>{
      handleInfoChange(update);
    })
  });

  handleInfoChange = (newData) => {
    const newStatus = newData.status;
    const newStation = newData.station.name;
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
      <label>Station: {state.Station}</label>
      </>
    );
  }
};
```

Special thanks to @ellcom for their list of longitude & latitude for each station.
