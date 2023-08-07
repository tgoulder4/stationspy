const index = require("index");
import { expect, jest, test } from "@jest/globals";
test("returns train dep and scheduled time", () => {
  expect(index("BRV").toBe(true));
});
