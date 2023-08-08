//tests:
//non existent code, wrong code
import { expect, jest, test } from "@jest/globals";
import findTrains from "../src/findTrains.js";
test("Non existent code returns an error", async () => {
  expect(await findTrains("")).toBe("Please enter a valid station code.");
});
test("Erronous station code returns an error", async () => {
  expect(await findTrains("SOMEWRONGCODE")).toBe(
    "Please enter a valid station code."
  );
  expect(await findTrains("AAA")).toBe("Please enter a valid station code.");
});
