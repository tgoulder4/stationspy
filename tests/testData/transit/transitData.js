const fs = require("node:fs").promises;
const { resolve } = require("node:path");
const atPlatform = async () => {
  // export the html from the test state
  try {
    const filePath = resolve("./tests/testData/transit/1atPlatform.html");
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
module.exports = { atPlatform };
