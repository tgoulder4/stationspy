import findTrains from "./findTrains";
const main = async () => {
  const trains = await findTrains("BRV");
  console.log(trains);
};
main();
