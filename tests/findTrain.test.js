//tests:
//non existent code, wrong code
const { expect, test } = require("@jest/globals");
import findTrains from "../src/findTrains";
test("Non existent code returns an error", () => {
  return findTrains("").then((data) => {
    expect(data).toStrictEqual({
      details:
        "Please enter a valid station code or the date and time entered.",
      information: "Error",
    });
  });
});
test("Erronous station code returns an error", async () => {
  return findTrains("AAA").then((data) => {
    expect(data).toStrictEqual({
      details:
        "Please enter a valid station code or the date and time entered.",
      information: "Error",
    });
  });
});
