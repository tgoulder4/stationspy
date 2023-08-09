const fs = require("node:fs").promises;
const { resolve } = require("node:path");
const reachedDestination = async () => {
  // export the html from the test state
  try {
    const filePath = resolve(
      "./tests/testData/transit/ReachedDestination.html"
    );
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
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
const journeyNotFound = async () => {
  // export the html from the test state
  try {
    const filePath = resolve("./tests/testData/erronous/404NotFound.html");
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
const leftPickupStation = async () => {
  // export the html from the test state
  try {
    const filePath = resolve("./tests/testData/transit/1_5departed.html");
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
const approachingAPass = async () => {
  // export the html from the test state
  try {
    const filePath = resolve("./tests/testData/transit/2approachingpass.html");
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
const approachingAStation = async () => {
  // export the html from the test state
  try {
    const filePath = resolve(
      "./tests/testData/transit/3approachingstation.html"
    );
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
const passedPassStation = async () => {
  // export the html from the test state
  try {
    const filePath = resolve("./tests/testData/transit/PassedPassStation.html");
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
const arriving = async () => {
  // export the html from the test state
  try {
    const filePath = resolve("./tests/testData/transit/3arriving.html");
    const html = await fs.readFile(filePath, "utf-8");
    return html;
  } catch (error) {
    return error;
  }
};
const transitData = {
  atPlatform,
  leftPickupStation,
  approachingAPass,
  approachingAStation,
  arriving,
  passedPassStation,
  reachedDestination,
};
const erronousData = {
  journeyNotFound,
};
module.exports = {
  transitData,
  erronousData,
};
