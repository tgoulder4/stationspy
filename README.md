# trainspy
Get departures at any UK train station & recieve updates on trains throughout their journey via the RTT API.

## Install trainspy
```js
npm i trainspy
```
## Example
```js
import trackTrain from "trainspy";

//trackTrain returns an emitter
trackTrain("P71733").then((myTrain) =>
  // if an event labelled "UPDATE" is emitted,
  myTrain.on("UPDATE", (currentState) => {
  // log the update to the console
    console.log(currentState);
  })
);
```

# Tracking a train
You first need the ID of the train.
Can be retrived by ```findTrains(stationCode)```:
```js
findTrains("WLF");
```
which returns departures from that station. E.g.:
```js
[
  {
    destination: 'Cambridge',
    departure: { actual: '2259', scheduled: '2259' },
    trainID: 'L14119'
  },
  {
    destination: 'London Liverpool Street',
    departure: { actual: '2259½', scheduled: '2259' },
    trainID: 'L14140'
  }
]
```

Assuming you have the trainID, use
```trackTrain(trainID, refreshRate)```:
```js
trackTrain("L14131").then((myTrain) =>
  // on an update,
  myTrain.on("UPDATE", (currentState) => {
    console.log(currentState);
  })
);
```
which emits live updates on the train via ```myTrain```. E.g.:
```js
{ status: 'Approaching', station: 'Hackney Downs [HAC]' }
{ status: 'Departed', station: 'Hackney Downs [HAC]' }
{ status: 'Approaching', station: 'Clapton [CPT]' }
{ status: 'Departed', station: 'Clapton [CPT]' }
```
