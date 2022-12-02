require("dotenv").config();
const { setClient, getValues, updateValues, generateLimits } = require("./gsheet");

async function main() {
  try {
    await setClient();

    const data = await getValues(`Data!A251:I501`);

    console.log("Data!A251:I501", data.status, data.statusText);

    if (data.status === 200) {
      simulate(data.data.values, 250, "0");
    }
  } catch (error) {
    console.error(error);
  }
}

async function simulate(data, index, shares, uplt, lwlt, last) {
  if (data.length === 0) return;

  const slice = data.shift();

  const [timestamp, open, high, low, close, volume, average14, average20, average40] = slice;

  switch (shares) {
    case "0":
      const generate = await generateLimits("Data!K2:L2", index, 250, 30, "E", "J");
      console.log(generate.status, generate.statusText);
      if (generate.status !== 200) throw new Error("Error while Generating Limits", { cause: generate });
      [[uplt, lwlt]] = generate.data.updatedData.values;

      if (volume > average14) {
        // Buy at zero
        if (average20 > average40 && close > average20 && close > average40 /* && close < lwlt */) {
          console.log(`${timestamp} - B>S at ${close} and ${volume}`);
          // index = index + 1;
          last = close;
          shares = "B";
          await updateValues(`Data!L${index + 1}`, [[shares]]);
        }
        // Sell at zero
        if (average20 < average40 && close < average20 && close < average40 /* && close > uplt */) {
          console.log(`${timestamp} - S>B at ${close} and ${volume}`);
          // index = index + 1;
          last = close;
          shares = "S";
          await updateValues(`Data!L${index + 1}`, [[shares]]);
        }
      }
      break;

    case "B":
      // Sell after Buy
      if (close <= average20 && close > uplt) {
        console.log(`${timestamp} - S>B at ${close} and ${volume}`);
        // index = index + 1;
        shares = "0";
        // log.amount = close - log.startclose; // this will have to think about later
        await updateValues(`Data!L${index + 1}`, [[shares, close - last]]);
      }
      break;

    case "S":
      // Buy after Sell
      if (close >= average20 && close < lwlt) {
        console.log(`${timestamp} - S>B at ${close} and ${volume}`);
        // index = index + 1;
        shares = "0";
        // log.amount = log.startclose - close; // this will have to think about later
        await updateValues(`Data!L${index + 1}`, [[shares, last - close]]);
      }
      break;
  }

  console.log(data.length, index, shares, uplt, lwlt, last);
  setTimeout(() => simulate(data, index + 1, shares, uplt, lwlt, last), 1e3);
}

main();
