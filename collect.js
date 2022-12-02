require("dotenv").config();
const { login, logout, collect } = require("./smartapi");
const { setClient, updateValues, calculateValues } = require("./gsheet");

async function main() {
  try {
    await login();

    const data = await collect({
      exchange: "NSE",
      symboltoken: "11483",
      interval: "ONE_HOUR",
      fromdate: "2022-06-27 09:00",
      todate: "2022-11-25 15:30"
    });

    console.log(data.length);
    // console.log([timestamp, open, high, low, close, volume]);

    await logout();

    await setClient();

    const update = await updateValues(
      `Data!2:${data.length + 1}`,
      data.map((d) => {
        d[0] = d[0].slice(0, 10);
        return d;
      })
    );

    console.log(update.data, update.status, update.statusText);

    const average = await calculateValues(data[0].length, data.length + 1, "E", "F");

    console.log(average.data, average.status, average.statusText);
  } catch (error) {
    console.error(error);
  }
}

main();
