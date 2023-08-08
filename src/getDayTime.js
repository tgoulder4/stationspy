const dayjs = require("dayjs");
module.exports = function getCurrentDayTime(timeString) {
  return dayjs().format(timeString);
};
