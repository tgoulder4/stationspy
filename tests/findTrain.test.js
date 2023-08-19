//tests:
//non existent code, wrong code
const { expect, test } = require("@jest/globals");
const findTrains = require("../src/findTrains");
test("Non existent code returns an error", async () => {
  expect(await findTrains("")).toStrictEqual({
    details: "Please enter a valid station code or the date and time entered.",
    information: "Error",
  });
});
test("Erronous station code returns an error", async () => {
  expect(await findTrains("AAA")).toStrictEqual({
    details: "Please enter a valid station code or the date and time entered.",
    information: "Error",
  });
});
