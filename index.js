import fs from "fs";
import axios from "axios";
import authorize from "./src/auth.js";
import { logError, logInfo, logDebug, logSummary } from "./src/logging.js"; 
import  parseSongList  from "./src/songParser";

import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

const playlistTitle = "My New Playlist";
const playlistDescription = "A playlist created from a text list of songs";

/**
 * API Key is used for public access to the API (like searching public videos on YouTube).
 * OAuth 2.0 is used for accessing user-specific data, such as private playlists, uploaded videos, or managing content.
 */

let oAuthTokenConfig;
let ACCESS_TOKEN;
let BASE_URL;
let headers;
const API_KEY = process.env.YOUTUBE_API_KEY;

// Fetch playlists from the authenticated user
async function getPlaylists() {
  const url = `${BASE_URL}/playlists?part=snippet&mine=true`;
  try {
    const response = await axios.get(url, { headers });
    logInfo(
      `Fetched playlists: ${response.data.items.length} playlists found.`
    );
    return response.data.items || [];
  } catch (error) {
    logDebug("Playlist URL: " + url);
    logError("fetching playlists", error);
    throw error; // Rethrow to stop execution
  }
}

// Create a new playlist
async function createPlaylist(title, description) {
  const data = {
    snippet: { title, description },
    status: { privacyStatus: "public" },
  };
  const url = `${BASE_URL}/playlists?part=snippet,status`;
  try {
    const response = await axios.post(url, data, { headers });
    logInfo(`Created new playlist: '${title}' with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    if (
      error.response &&
      error.response.data.error.code === 403 &&
      error.response.data.error.errors[0].reason === "quotaExceeded"
    ) {
      logError("Quota exceeded. You have exceeded the daily API quota limit.");
      // TODO: retry logic or wait until the quota is reset
      return null;
    } else {
      logError("Error creating playlist", error);
      throw error; // Rethrow to stop execution
    }
  }
}
/**
 * Search for multiple videos on YouTube using batch API calls
 * API Key is used for public access to the API (like searching public videos on YouTube).
 * @param {*} query
 * @returns
 */
async function searchVideos(songs) {
  const batchRequests = songs.map((song) => {
    const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(
      song
    )}&type=video&key=${API_KEY}`;
    logDebug(`Request URL: ${url}`);

    return axios
      .get(url)
      .then((response) => {
        const items = response.data.items || [];
        if (items.length > 0) {
          logInfo(`Found video for '${song}': ${items[0].snippet.title}`);
          return items[0].id.videoId;
        } else {
          logInfo(`No video found for '${song}'`);
          return null;
        }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data.error.code === 403 &&
          error.response.data.error.errors[0].reason === "quotaExceeded"
        ) {
          logError(
            "Quota exceeded. You have exceeded the daily API quota limit."
          );
          // TODO: retry logic or wait until the quota is reset
        } else {
          logError(`Error searching for video: '${query}'`);
          logError(`Error Message: ${error.message}`);
          if (error.response) {
            logError(`Response Data: ${JSON.stringify(error.response.data)}`);
          } else if (error.request) {
            logError(`Request made but no response received`);
          } else {
            logError(`Error Type: ${error.name}`);
          }
        }
        return null;
      });
  });

  return Promise.all(batchRequests); // Wait for all searches to complete
}

// Add a video to a playlist (batch operation)
async function addVideosToPlaylist(playlistId, videoIds) {
  const data = videoIds
    .filter((videoId) => videoId !== null) // Filter out null values
    .map((videoId) => ({
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    }));

  if (data.length === 0) return;

  const url = `${BASE_URL}/playlistItems?part=snippet`;
  try {
    await axios.post(url, data, { headers });
    logInfo(`Added ${data.length} videos to playlist (ID: ${playlistId})`);
  } catch (error) {
    if (
      error.response &&
      error.response.data.error.code === 403 &&
      error.response.data.error.errors[0].reason === "quotaExceeded"
    ) {
      logError("Quota exceeded. You have exceeded the daily API quota limit.");
      // TODO: retry logic or wait until the quota is reset
    } else {
      logError(`Error adding videos to playlist (ID: ${playlistId})`, error);
    }
  }
}

// Check if a video already exists in the playlist
async function isVideoInPlaylist(playlistId, videoId) {
  const url = `${BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}`;
  try {
    const response = await axios.get(url, { headers });
    return response.data.items.some(
      (item) => item.snippet.resourceId.videoId === videoId
    );
  } catch (error) {
    logError(`Error checking if video exists in playlist: ${videoId}`, error);
    return false;
  }
}

// Main function to manage the playlist and add videos
async function main() {
  try {
    oAuthTokenConfig = JSON.parse(fs.readFileSync("OAuthToken.json", "utf8"));
    logInfo("Successfully loaded token file.");
  } catch (error) {
    logError("Error reading or parsing OAuthToken.json:", error);
    process.exit(1); // Exit the process if OAuthToken.json cannot be loaded
  }

  ACCESS_TOKEN = oAuthTokenConfig.access_token;
  BASE_URL = "https://www.googleapis.com/youtube/v3";

  if (!API_KEY) {
    logError("API Key is missing in OAuthToken.json");
    process.exit(1);
  }
  if (!ACCESS_TOKEN) {
    logError("Access Token is missing in OAuthToken.json");
    process.exit(1);
  }

  headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  let playlistId = null;

  try {
    const playlists = await getPlaylists();
    for (const playlist of playlists) {
      if (playlist.snippet.title === playlistTitle) {
        playlistId = playlist.id;
        logInfo(
          `Playlist '${playlistTitle}' already exists. ID: ${playlistId} & playlistTitle: ${playlistTitle}`
        );
        break;
      }
    }

    if (!playlistId) {
      playlistId = await createPlaylist(playlistTitle, playlistDescription);
      logInfo(
        `Created new playlist. ID: ${playlistId} & playlistTitle: ${playlistTitle}`
      );
    }

    const songs = parseSongList("songs.txt");

    // Track the counters
    let existingSongsCount = 0;
    let newSongsCount = 0;
    let failedSongsCount = 0;

    const videoIds = await searchVideos(song);

    for (const videoId of videoIds) {
      if (videoId) {
        const isInPlaylist = await isVideoInPlaylist(playlistId, videoId);
        if (isInPlaylist) {
          logInfo(`Song '${song}' already exists in the playlist.`);
          existingSongsCount++;
        } else {
          newSongsCount++;
        }
      } else {
        logError(`Skipping '${song}', no video found.`);
        failedSongsCount++;
      }
    }

    // Log summary
    logSummary(`Summary:`);
    logSummary(`Existing songs: ${existingSongsCount}`);
    logSummary(`Newly added songs: ${newSongsCount}`);
    logSummary(`Failed to add songs: ${failedSongsCount}`);

    // Add videos to playlist in batch
    await addVideosToPlaylist(playlistId, videoIds);
  } catch (error) {
    logError("An error occurred during playlist management:", error);
  }
}

// Run the script after authorization
authorize(main);
