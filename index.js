require("dotenv").config();
const { login, logout, collect } = require("./smartapi");
const { setClient, updateValues } = require("./gsheet");

async function main() {
  try {
    await login();

    const data = await collect({
      exchange: "NSE",
      symboltoken: "16669",
      interval: "ONE_DAY",
      fromdate: "2021-08-22 09:00",
      todate: "2022-11-25 15:30"
    });

    console.log(data.length);
    // console.log([timestamp, open, high, low, close, volume]);

    await logout();

    await setClient();

    const update = await updateValues(
      "ROWS",
      `Data!2:${data.length + 1}`,
      data.map((d) => {
        d[0] = d[0].slice(0, 10);
        return d;
      })
    );

    console.log(update.data);
  } catch (error) {
    console.error(error);
  }
}

main();
