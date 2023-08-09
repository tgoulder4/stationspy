# trainspy
Get departures at any UK train station & recieve updates on trains throughout their journey via the RTT API.

## Install trainspy
```js
npm i trainspy
```
# Get departures
Departures can be retrived by ```findTrains(stationCode)``` or ```findTrains(stationName)```:
```js
findTrains("WLF") || findTrains("Whittlesford Parkway")
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
You first need the ```serviceID```.
Can be retrived by ```findTrains(stationCode)``` as shown above.
```js
trackTrain(serviceID, refreshRate)
```

```js
trackTrain("L14125").then((emitter) => {
  emitter.on("UPDATE", (update) => {
    console.log(update) //replace with your logic in terms of the update
  });
});
```
```trackTrain()``` returns a promise - ```emitter```. Subscribe to this emitter as shown above. 
This emits live updates (as JSON) on the train until the journey is complete.
```js
{
  status: 'Approaching',
  station: {
    name: 'Rugeley Town',
    code: [ 'RGT' ],
    arrival: { actual: '0615½' },
    departure: { actual: null },
    stopsHere: true
  },
  destination: 'Rugeley Trent Valley',
  delay: '+3'
}
```
## More examples
```js
import trackTrain from "trainspy";

trackTrain("P71733").then((myTrainTracker) =>
  myTrainTracker.on("UPDATE", (currentState) => {
    document.getElementByID("status").innerHTML = currentState.status;
    document.getElementByID("station").innerHTML = currentState.station;
  })
);
```
