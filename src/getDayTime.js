import dayjs from "dayjs";
export default function getCurrentDayTime(timeString) {
  return dayjs().format(timeString);
}
