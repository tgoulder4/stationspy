# trainspy
Get departures at any UK train station & recieve updates on trains throughout their journey via a custom made RTT API.

## Install trainspy
```js
npm i trainspy
```
# Find trains by station
Departures can be retrieved by ```stationCode``` or ```stationName```:
```js
const x = findTrains("WLF")
const y = findTrains("Whittlesford Parkway") //same result as x
```
which returns in the following format:
```js
[
  {
    destination: 'Cambridge',
    departure: { actual: '2259', scheduled: '2259' },
    serviceID: 'L14119'
  }
]
```

# Tracking a train
Track a train that departed today
```js
trackTrain(serviceID, timeTillRefresh?) //minimum timeTillRefresh of 5 seconds
```

You first need the ```serviceID```.
Can be retrived by ```findTrains(stationCode)``` as shown above.

```js
trackTrain("P70052").then((emitter) => {
  emitter.on("journeyUpdate", (data) => {
    //your code for journey updates here
  });
  emitter.on("errorUpdate", (data) => console.log(data));
});
```
```trackTrain()``` returns a promise - ```emitter```. Subscribe as shown above. 
This emits live updates (as JSON) on the train until the journey is complete.
```js
{
  status: 'Arriving',
  station: {
    name: 'Dorridge',
    code: '[DDG]',
    arrival: { actual: '2219', scheduled: '2219' },
    platform: { actual: '3', scheduled: null },
    departure: { actual: null, scheduled: null },
    stopsHere: true
  },
  destination: { name: 'Dorridge', code: '[DDG]' },
  delay: '+1'
}
```
| Status  | Explanation |
| ------------- | ------------- |
| Passed  | Train just passed this non-stopping station  |
| Approaching  | Train is now approaching this station  |
| Arriving  | Train is now arriving at this stopping station  |
| At platform  | Train is now at a platform of this stopping station  |
| Departed  | Train just departed this stopping station  |

## More examples
Track the next service from London to Manchester (Provided this service departs in the next two hours):
```js
import {trackTrain, findTrains} from "trainspy";

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


Change html content
```js
import {trackTrain} from "trainspy";

trackTrain("P71733").then((myTrainTracker) =>
  myTrainTracker.on("journeyUpdate", (currentState) => {
    document.getElementByID("status").innerHTML = currentState.status;
    document.getElementByID("station").innerHTML = currentState.station.name;
  });
  myTrainTracker.on("errorUpdate",(error)=>{
    console.log(error)
  }
);
```
