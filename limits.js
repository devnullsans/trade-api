require("dotenv").config();
const { setClient, generateLimits } = require("./gsheet");

async function main() {
  try {
    await setClient();

    for (let i = 250; i < 315; i++) {
      const generate = await generateLimits(`K${i - 248}:L${i - 248}`, i, 250, "E", "J");
      console.log(generate.data, generate.status, generate.statusText);
    }
    console.log("Done !");
  } catch (error) {
    console.error(error);
  }
}

setTimeout(() => main(), 1e4);
