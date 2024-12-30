/**
 * This script authenticates the user via OAuth 2.0 and saves the access token to OAuthToken.json.
 * 1) Request OAuth authorization from the user.
 * 2) Once authorized, generate an access token.
 * 3) Save that token to OAuthToken.json.
 */

import { google } from "googleapis";
import fs from "fs";
import http from "http";
import open from "open"; // Import as an ES module
import { logError, logInfo, logDebug } from "./logging.js"; // Importing logging

let Oauth2Port = 27862;
const SCOPES = ["https://www.googleapis.com/auth/youtube"];
const TOKEN_PATH = "OAuthToken.json"; // Save the token here
const REDIRECT_URL = "http://localhost:" + Oauth2Port; // Redirect URI

// Load the OAuth2 client secrets
let credentials;
try {
  credentials = JSON.parse(fs.readFileSync("client_secret.json", "utf8"));
  logInfo("Successfully loaded OAuth2 client secrets.");
} catch (error) {
  logError("Error reading or parsing client_secret.json:", error);
  process.exit(1); // Exit if client secrets cannot be loaded
}

// Authorize the client with the given credentials
export default function authorize(callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URL
  );

  // Check if we have a previously stored token
  if (fs.existsSync(TOKEN_PATH)) {
    logInfo("Token file found, loading credentials...");
    try {
      const token = fs.readFileSync(TOKEN_PATH, "utf8");
      const parsedToken = JSON.parse(token);

      // Check if token has expired and refresh if necessary
      if (parsedToken.refresh_token) {
        oAuth2Client.setCredentials(parsedToken);
        logInfo("Token loaded and OAuth2 client authorized.");
        callback(oAuth2Client);
      } else {
        logError(
          "Refresh token is missing from stored credentials so going by requesting new token.."
        );
        getNewToken(oAuth2Client, callback);
        // process.exit(1);
      }
    } catch (error) {
      logError("Error reading or parsing token file:", error);
      process.exit(1); // Exit if token cannot be read
    }
  } else {
    logInfo("Token file not found, requesting new token...");
    getNewToken(oAuth2Client, callback);
  }
}

// Refresh the access token using the stored refresh token
async function refreshAccessToken() {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;
    logInfo("New Access Token: '${newAccessToken}'");
    return newAccessToken;
  } catch (error) {
    logError("Error refreshing access token:", error);
    throw error;
  }
}

function handleToken(oAuth2Client, token) {
  oAuth2Client.setCredentials(token);
  try {
    // Save the token to the OAuthToken.json file
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token)); // Synchronous file write
    logInfo("Token stored to '${TOKEN_PATH}'");
  } catch (error) {
    logError("Error storing the token:", error);
    return;
  }
}

// Get and store a new token after prompting for user authorization
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // Request offline access to get a refresh token
    scope: SCOPES,
  });

  logInfo("Authorize this app by visiting this URL:");
  logDebug(authUrl); // This will print the URL

  // Create a local server to handle the OAuth callback
  const server = http.createServer((req, res) => {
    logInfo("Incoming request URL: '${req.url}'"); // Log the URL of the request
    if (req.url.indexOf("/?code=") > -1) {
      const code = new URL(
        req.url,
        `http://${req.headers.host}`
      ).searchParams.get("code");
      logInfo("Code received. Exchanging for token...");
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          logError("Error retrieving access token:", err);
          return;
        }

        // Check if refresh_token exists in the response
        if (!token.refresh_token) {
          logError(
            "Refresh token is missing in the response but still storing the token."
          );
          // res.end("Authentication failed as refresh token is missing in the response.");
          // server.close();
        } else {
          logInfo("Refresh token found: ${token.refresh_token}'");
        }

        logInfo("Token received: '${token}'");

        handleToken(oAuth2Client, token);

        res.end("Authentication successful! You can close this window.");
        callback(oAuth2Client);
        server.close(); // Close the server after the token exchange is complete
      });
    }
  });

  server.listen(Oauth2Port, () => {
    logInfo("Listening on http://localhost: '${Oauth2Portl}'");
  });

  // Open the URL in the browser for the user to authenticate
  open(authUrl); // This automatically opens the URL in the default browser
}

// // TODO: Remove the following code block after testing
// // Call the authorize function to initiate the OAuth flow
// authorize((authClient) => {
//   logInfo("Authorization complete, access token stored!");
//   // You can now use `authClient` to make authorized requests to the YouTube API
// });
