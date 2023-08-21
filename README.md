# trainspy 2.0 🔍
[![Downloads](https://img.shields.io/npm/dt/trainspy?logo=npm&style=flat-square)](https://npmjs.com/package/trainspy) [![Discord](https://img.shields.io/discord/667479986214666272?logo=discord&logoColor=white&style=flat-square)](https://discord.gg/3bnnkvrZwc)

Get fast & free departures at any UK train station & recieve instant real-time updates on trains throughout their journey. Version 2.0 brings exact location tracking with precise latitude & longitude co-ordinates!

_Add me on discord - I'd love to hear your feedback! @thaitiesthetie_

## Install trainspy

```js
npm i trainspy
```

# Find departures

`findTrains(stationNameOrCode)` _-> Promise\<typeof Object>_

```js
import { findTrains } from "trainspy";

(async()=> {

  const trains = await findTrains("WLF");
  const moreTrains = await findTrains("Solihull");

  console.log(trains);
})();
```

this yields a response:

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

`trackTrain(serviceID, date?, timeTillRefresh?)` _-> Promise\<typeof EventEmitter>_

Emit live updates on a train until it's journey is complete. You first need the `serviceID`. Retrieved by `findTrains(stationNameOrCode)` as shown above.

E.g. ServiceID `P70052` departing on 18/08/2023:

```js
import { trackTrain } from "trainspy";

trackTrain("P70052", "2023-08-18").then((emitter) => {
  emitter.on("journey", (update) => {
    //your code for journey updates!
  });
  emitter.on("information", (update) => {
    console.log(update);
  });
});
```

_**🌻 Note**: Date must be in the form YYYY-MM-DD, defaults to today. You must enter an event name of "journey" for journey updates, and "information" for information (error, cancellation etc.) updates._

Example journey updates:

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
```js
{
  status: 'Not departed',
  station: {
    name: 'Birmingham New Street',
    code: 'BHM',
    location: { latitude: 52.4778312827, longitude: -1.9002004707 },
    platform: '7B',
    stopsHere: true,
    delay: 0,
    arrival: { actual: null, scheduled: null },
    departure: { actual: null, scheduled: '0500' }
  },
  callingPoints: [
    {
      name: 'Birmingham New Street',
      code: 'BHM',
      location: { latitude: 52.4778312827, longitude: -1.9002004707 },
      platform: '7B',
      stopsHere: true,
      delay: 0,
      arrival: { actual: null, scheduled: null },
      departure: { actual: null, scheduled: '0500' }
    },
    ...]
}
```

Example information update:

```js
  {
    information: 'Error', details: 'Check service ID.'
  }
```

## Return values

Journey updates

| Property      | Type                   |
| ------------- | -----------------------|
| status        | string                 |
| station       | { `name`: string, `code`: string \| null, `location`: { `longitude`: number \| null, `latitude`: number \| null }`stopsHere`: boolean, `delay`: number \| null, `arrival`: { `actual`: string \| null, `scheduled`: string \| null }, `departure`: -same as arrival- } |
| callingPoints | Array\<station> |

Information updates
| Property | Type |
| ------------- | ---------------------------- |
| information | string |
| details | string |

Statuses

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

const response = await findTrains("EUS");
const serviceID = response.departures.find(
  (departure) => departure.destination == "Manchester Piccadilly"
).serviceID;
trackTrain(serviceID).then((emitter) => {
  emitter.on("journey", (update) => {
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

A project by Tye.
Special thanks to @ellcom for their list of longitude & latitude for each station, and to RealTimeTrains for providing the primitives for this project.
