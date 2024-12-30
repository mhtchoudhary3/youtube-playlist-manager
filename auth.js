/**
 * This script authenticates the user via OAuth 2.0 and saves the access token to config.json.
 * 1) Request OAuth authorization from the user.
 * 2) Once authorized, generate an access token.
 * 3) Save that token to config.json.
 */

import { google } from "googleapis";
import fs from "fs";
import readline from "readline";
import http from "http";
import open from "open";  // Import as an ES module

let Oauth2Port = 27862;
const SCOPES = ["https://www.googleapis.com/auth/youtube"];
const TOKEN_PATH = "config.json";  // Save the token here
const REDIRECT_URL = "http://localhost:" + Oauth2Port  ;  // Redirect URI

// Load the OAuth2 client secrets
let credentials;
try {
  credentials = JSON.parse(fs.readFileSync("client_secret.json", "utf8"));
  console.log("Successfully loaded OAuth2 client secrets.");
} catch (error) {
  console.error("Error reading or parsing client_secret.json:", error);
  process.exit(1);  // Exit if client secrets cannot be loaded
}

// Authorize the client with the given credentials
function authorize(callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URL);

  // Check if we have a previously stored token
  if (fs.existsSync(TOKEN_PATH)) {
    console.log("Token file found, loading credentials...");
    try {
      const token = fs.readFileSync(TOKEN_PATH, "utf8");
      oAuth2Client.setCredentials(JSON.parse(token));
      console.log("Token loaded and OAuth2 client authorized.");
      callback(oAuth2Client);
    } catch (error) {
      console.error("Error reading or parsing token file:", error);
      process.exit(1);  // Exit if token cannot be read
    }
  } else {
    console.log("Token file not found, requesting new token...");
    getNewToken(oAuth2Client, callback);
  }
}

      
       
function handleToken (oAuth2Client, token)  {
  oAuth2Client.setCredentials(token);
  try {
    // Save the token to the config.json file
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));  // Synchronous file write
    console.log("Token stored to", TOKEN_PATH);
  } catch (error) {
    console.error("Error storing the token:", error);
    return;
  }
};

// Get and store a new token after prompting for user authorization
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this URL:");
  console.log(authUrl); // This will print the URL

  // Create a local server to handle the OAuth callback
  const server = http.createServer((req, res) => {
    console.log("Incoming request URL:", req.url);  // Log the URL of the request
    if (req.url.indexOf("/?code=") > -1) {
      const code = new URL(req.url, `http://${req.headers.host}`).searchParams.get("code");
      console.log("Code received. Exchanging for token...");
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error("Error retrieving access token:", err);
          return;
        }
    
        handleToken(oAuth2Client, token);
        res.end("Authentication successful! You can close this window.");
        callback(oAuth2Client);
        server.close();  // Close the server after the token exchange is complete
      });
    }
  });

  server.listen(Oauth2Port, () => {
    console.log("Listening on http://localhost:" + Oauth2Port);
  });

  // Open the URL in the browser for the user to authenticate
  open(authUrl);  // This automatically opens the URL in the default browser
}

// Call the authorize function to initiate the OAuth flow
authorize((authClient) => {
  console.log("Authorization complete, access token stored!");
  // You can now use `authClient` to make authorized requests to the YouTube API
}); 