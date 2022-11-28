async function simulate() {
  try {
    for await (const data of Data.find({}).sort({ timestamp: 1 })) {
      const { timestamp, close, volume, average14, average20, average40 } = data;
      if (average14 && average20 && average40)
        await execute(timestamp, close, volume, average14, average20, average40);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

async function execute(ts, close, volume, average14, average20, average40) {
  const timestamp = new Date(ts);
  switch (shares) {
    case "0":
      if (volume > average14) {
        // Buy at zero
        if (average20 > average40 && close > average20 && close > average40) {
          shares = "B";
          log = await Log.create({
            startts: timestamp,
            type: "B>S",
            startclose: close,
            startvolume: volume,
            average14,
            average20,
            average40
          });
        }
        // Sell at zero
        if (average20 < average40 && close < average20 && close < average40) {
          shares = "S";
          log = await Log.create({
            startts: timestamp,
            type: "S>B",
            startclose: close,
            startvolume: volume,
            average14,
            average20,
            average40
          });
        }
      }
      break;
    case "B":
      // Sell after Buy
      if (close <= average20) {
        shares = "0";
        log.endts = timestamp;
        log.endclose = close;
        log.amount = close - log.startclose;
        await log.save();
      }
      break;
    case "S":
      // Buy after Sell
      if (close >= average20) {
        shares = "0";
        log.endts = timestamp;
        log.endclose = close;
        log.amount = log.startclose - close;
        await log.save();
      }
      break;
  }
}
