/**
 * This script authenticates the user via OAuth 2.0 and saves the access token to OAuthToken.json.
 * 1) Request OAuth authorization from the user.
 * 2) Once authorized, generate an access token.
 * 3) Save that token to OAuthToken.json.
 */

import { google } from 'googleapis';
import fs from 'fs';
import http from 'http';
import open from 'open'; // Import as an ES module
import { logError, logInfo, logDebug } from './logging.js'; // Importing logging

let oauth2Port = 27862;
const SCOPES = ['https://www.googleapis.com/auth/youtube'];
const TOKEN_PATH = 'OAuthToken.json'; // Save the token here
const REDIRECT_URL = 'http://localhost:' + oauth2Port; // Redirect URI

// Load the OAuth2 client secrets
let credentials;
try {
  credentials = JSON.parse(fs.readFileSync('client_secret.json', 'utf8'));
  logInfo('Successfully loaded OAuth2 client secrets.');
} catch (error) {
  logError('Error reading or parsing client_secret.json:', error);
  process.exit(1); // Exit if client secrets cannot be loaded
}

// Authorize the client with the given credentials
export default function authorize(callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URL,
  );

  // Check if we have a previously stored token
  if (fs.existsSync(TOKEN_PATH)) {
    logInfo('Token file found, loading credentials...');
    try {
      const token = fs.readFileSync(TOKEN_PATH, 'utf8');
      const parsedToken = JSON.parse(token);

      if (isTokenExpired(token)) {
        logInfo('Token has expired, refreshing...');

        refreshAccessToken(oAuth2Client, token.refresh_token)
          .then((newToken) => {
            oAuth2Client.setCredentials(newToken);
            logInfo('Token refreshed and OAuth2 client authorized.');
            callback(oAuth2Client);
          })
          .catch((err) => {
            logError('Error refreshing token:', err);
            getNewToken(oAuth2Client, callback);
          });
      } else {
        oAuth2Client.setCredentials(parsedToken);
        logInfo('Token loaded and OAuth2 client authorized.');
        callback(oAuth2Client);
      }
    } catch (error) {
      logError('Error reading or parsing token file:', error);
      process.exit(1); // Exit if token cannot be read
    }
  } else {
    logInfo('Token file not found, requesting new token...');
    getNewToken(oAuth2Client, callback);
  }
}

// Refresh the access token using the stored refresh token
async function refreshAccessToken(oAuth2Client, refresh_token) {
  try {
    const { credentials } =
      await oAuth2Client.refreshAccessToken(refresh_token);
    const newAccessToken = credentials.access_token;
    const newRefreshToken = credentials.refresh_token;
    const expiry_date = credentials.expiry_date;
    logInfo(`New Access Token: ${newAccessToken}`);

    // Save the refreshed token
    const newToken = {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expiry_date: expiry_date,
    };
    saveToken(newToken); // Save the new token to file
    return newToken;
  } catch (error) {
    logError('Error refreshing access token:', error);
    throw error;
  }
}

// Save the token to OAuthToken.json
function saveToken(token) {
  try {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    logInfo(`Token stored to '${TOKEN_PATH}`);
  } catch (error) {
    logError('Error storing the token:', error);
  }
}

// Check if the token has expired
function isTokenExpired(token) {
  const expiryDate = token.expiry_date;
  const now = Date.now();
  return expiryDate <= now;
}

// Get and store a new token after prompting for user authorization
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Request offline access to get a refresh token
    scope: SCOPES,
  });

  logInfo('Authorize this app by visiting this URL:');
  logDebug(authUrl); // This will print the URL

  // Create a local server to handle the OAuth callback
  const server = http.createServer((req, res) => {
    logInfo(`Incoming request URL: ${req.url}`); // Log the URL of the request
    if (req.url.indexOf('/?code=') > -1) {
      const code = new URL(
        req.url,
        `http://${req.headers.host}`,
      ).searchParams.get('code');
      logInfo('Code received. Exchanging for token...');
      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          logError('Error retrieving access token:', err);
          return;
        }

        // Save the token to the file
        saveToken(token);

        res.end('Authentication successful! You can close this window.');
        callback(oAuth2Client);
        server.close(); // Close the server after the token exchange is complete
      });
    }
  });

  server.listen(oauth2Port, () => {
    logInfo(`Listening on http://localhost: ${oauth2Port}`);
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
