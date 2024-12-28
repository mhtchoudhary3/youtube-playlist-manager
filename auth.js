const { google } = require("googleapis");
const fs = require("fs");
const readline = require("readline");

const SCOPES = ["https://www.googleapis.com/auth/youtube"];
const TOKEN_PATH = "config.json";  // Save the token here

// Load the OAuth2 client secrets
const credentials = JSON.parse(fs.readFileSync("client_secret.json"));

// Authorize the client with the given credentials
function authorize(callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have a previously stored token
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

// Get and store a new token after prompting for user authorization
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) {
        console.error("Error retrieving access token", err);
        return;
      }
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error("Error storing the token", err);
        else console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// Export the function to get the OAuth2 client
module.exports = authorize;
