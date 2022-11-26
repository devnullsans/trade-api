const { getTOTP } = require("simple-totp");

const APIERRORCODES = new Map([
  ["AG8001", "Invalid Token"],
  ["AG8002", "Token Expired"],
  ["AG8003", "Token missing"],
  ["AB8050", "Invalid Refresh Token"],
  ["AB8051", "Refresh Token Expired"],
  ["AB1000", "Invalid Email Or Password"],
  ["AB1001", "Invalid Email"],
  ["AB1002", "Invalid Password Length"],
  ["AB1003", "Client Already Exists"],
  ["AB1004", "Something Went Wrong, Please Try After Sometime"],
  ["AB1005", "User Type Must Be USER"],
  ["AB1006", "Client Is Block For Trading"],
  ["AB1007", "AMX Error"],
  ["AB1008", "Invalid Order Variety"],
  ["AB1009", "Symbol Not Found"],
  ["AB1010", "AMX Session Expired"],
  ["AB1011", "Client not login"],
  ["AB1012", "Invalid Product Type"],
  ["AB1013", "Order not found"],
  ["AB1014", "Trade not found"],
  ["AB1015", "Holding not found"],
  ["AB1016", "Position not found"],
  ["AB1017", "Position conversion failed"],
  ["AB1018", "Failed to get symbol details"],
  ["AB2000", "Error not specified"],
  ["AB2001", "Internal Error, Please try after sometime"],
  ["AB1031", "Old Password Mismatch"],
  ["AB1032", "User Not Found"],
  ["AB2002", "ROBO order is block"]
]);

const tokens = {
  jwtToken: "",
  refreshToken: "",
  feedToken: 0
};

function totp() {
  const key = process.env.TOTPKEY ?? "";
  const secret = key.padEnd(Math.ceil(key.length / 8) * 8, "=");
  const { totp } = getTOTP(secret, "base32");
  return totp;
}

async function login() {
  const res = await fetch(
    "https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "0.0.0.0",
        "X-ClientPublicIP": "0.0.0.0",
        "X-MACAddress": "00:00:00:00:00:00",
        "X-PrivateKey": process.env.APIKEY ?? ""
      },
      body: JSON.stringify({
        clientcode: process.env.CLIENTID ?? "",
        password: process.env.PASSWORD ?? "",
        totp: totp()
      })
    }
  );

  const { status, message, errorcode, data } = await res.json();
  console.log(`smartapi login ${status} - ${message}`);

  if (res.ok) {
    tokens.jwtToken = data.jwtToken;
    tokens.refreshToken = data.refreshToken;
    tokens.feedToken = data.feedToken;
  } else {
    throw new Error(
      `${res.status}-${res.statusText}<smartapi login>${errorcode}-${APIERRORCODES.get(
        errorcode
      )}`
    );
  }
}

async function logout() {
  const res = await fetch(
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/user/v1/logout",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "CLIENT_LOCAL_IP",
        "X-ClientPublicIP": "CLIENT_PUBLIC_IP",
        "X-MACAddress": "MAC_ADDRESS",
        "X-PrivateKey": process.env.APIKEY ?? "",
        Authorization: `Bearer ${tokens.jwtToken}`
      },
      body: JSON.stringify({
        clientcode: process.env.CLIENTID ?? ""
      })
    }
  );

  const { status, message, errorcode } = await res.json();
  console.log(`smartapi logout ${status} - ${message}`);

  if (res.ok) {
    tokens.jwtToken = "";
    tokens.refreshToken = "";
    tokens.feedToken = 0;
  } else {
    throw new Error(
      `${res.status}-${res.statusText}<smartapi logout>${errorcode}-${APIERRORCODES.get(
        errorcode
      )}`
    );
  }
}

async function refresh() {
  const res = await fetch(
    "https://apiconnect.angelbroking.com/rest/auth/angelbroking/jwt/v1/generateTokens",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "CLIENT_LOCAL_IP",
        "X-ClientPublicIP": "CLIENT_PUBLIC_IP",
        "X-MACAddress": "MAC_ADDRESS",
        "X-PrivateKey": process.env.APIKEY ?? "",
        Authorization: `Bearer ${tokens.jwtToken}`
      },
      body: JSON.stringify({
        refreshToken: tokens.refreshToken
      })
    }
  );

  const { status, message, errorcode, data } = await res.json();
  console.log(`smartapi refresh ${status} - ${message}`);

  if (res.ok) {
    tokens.jwtToken = data.jwtToken;
    tokens.refreshToken = data.refreshToken;
    tokens.feedToken = data.feedToken;
  } else {
    throw new Error(
      `${res.status}-${res.statusText}<smartapi refresh>${errorcode}-${APIERRORCODES.get(
        errorcode
      )}`
    );
  }
}

// options =
// {
//   exchange: 'NSE',
//   symboltoken: process.env.SYMBOLTOK ?? '0',
//   interval: process.env.INTERVAL ?? 'FIFTEEN_MINUTE',
//   fromdate: '',// 2021-06-03 09:00
//   todate: '',// 2022-06-03 15:30
// }`
async function collect(options) {
  const res = await fetch(
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "CLIENT_LOCAL_IP",
        "X-ClientPublicIP": "CLIENT_PUBLIC_IP",
        "X-MACAddress": "MAC_ADDRESS",
        "X-PrivateKey": process.env.APIKEY ?? "",
        Authorization: `Bearer ${tokens.jwtToken}`
      },
      body: JSON.stringify(options)
    }
  );

  const { status, message, errorcode, data } = await res.json();
  console.log(`smartapi collect ${status} - ${message}`);

  if (res.ok) {
    return data;
  } else {
    throw new Error(
      `${res.status}-${res.statusText}<smartapi collect>${errorcode}-${APIERRORCODES.get(
        errorcode
      )}`
    );
  }
}

module.exports = {
  login,
  logout,
  refresh,
  collect
};
