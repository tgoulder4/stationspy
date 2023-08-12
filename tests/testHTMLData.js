const reachedDestination = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/ReachedDestination.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const atPlatform = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/1atPlatform.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const journeyNotFoundTest = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/erronous/404NotFound.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const serviceCancelled = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/erronous/serviceCancelled.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const partiallyCancelled = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/erronous/partiallyCancelled.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const departedStoppingStation = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/1_5departed.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const notYetDeparted = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/notYetDeparted.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const approachingAPass = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/2approachingpass.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const passUnknownDelay = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/PassUnknownDelay.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const approachingAStation = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/3approachingstation.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const passedPassStation = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/PassedPassStation.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const arriving = async () => {
  // export the html from the test state
  try {
    const response = await fetch(
      "https://tgoulder4.github.io/tests/trainspyTests/transit/3arriving.html"
    );
    const html = await response.text();
    return html;
  } catch (error) {
    return error;
  }
};
const transitData = {
  atPlatform,
  departedStoppingStation,
  approachingAPass,
  approachingAStation,
  arriving,
  passedPassStation,
  reachedDestination,
  passUnknownDelay,
  notYetDeparted,
};
const erronousData = {
  journeyNotFoundTest,
  serviceCancelled,
  partiallyCancelled,
};
module.exports = {
  ...transitData,
  ...erronousData,
};
