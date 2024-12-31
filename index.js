import fs from "fs";
import axios from "axios";
import authorize from "./src/auth.js";
import { logError, logInfo, logDebug, logSummary } from "./src/logging.js";
import parseSongList from "./src/songParser.js";
import checkQuota from "./src/apiQuota.js";
import dotenv from "dotenv";
import { APIError, handleError } from "./src/errorHandling.js";

dotenv.config(); // Load environment variables from .env file

const playlistTitle = "My New Playlist";
const playlistDescription = "A playlist created from a text list of songs";

/**
 * API Key is used for public access to the API (like searching public videos on YouTube).
 * OAuth 2.0 is used for accessing user-specific data, such as private playlists, uploaded videos, or managing content.
 */

// Constants for quota cost per request
const QUOTA_COST = {
  search: 100, // Search API costs 100 units per request
  playlist: 50, // Playlist operations (create, list, add) costs 50 units per request
  video: 1, // Video-related operations (get video details, etc.) cost 1 unit per request
};

let totalQuotaUsed = 0; // Track total quota usage
let oAuthTokenConfig;
let ACCESS_TOKEN;
let BASE_URL;
let headers;
const API_KEY = process.env.YOUTUBE_API_KEY;

//When retrieving playlists or videos, always handle pagination to avoid hitting API limits.
async function getAllPlaylists() {
  let playlists = [];
  let nextPageToken = null;

  do {
    const url = `${BASE_URL}/playlists?part=snippet&mine=true&pageToken=${
      nextPageToken || ""
    }`;
    try {
      const response = await axios.get(url, { headers });
      playlists = playlists.concat(response.data.items || []);
      nextPageToken = response.data.nextPageToken;
      logInfo(`Fetched playlists page: ${nextPageToken}`);
    } catch (error) {
      handleError(error, "fetching playlists");
      break;
    }
  } while (nextPageToken); // Continue fetching as long as there's a next page token

  return playlists;
}

// Fetch playlists from the authenticated user
async function getPlaylists() {
  const url = `${BASE_URL}/playlists?part=snippet&mine=true`;
  try {
    const response = await axios.get(url, { headers });
    totalQuotaUsed += QUOTA_COST.playlist; // Add quota cost for playlist fetch
    logInfo(
      `Fetched playlists: ${response.data.items.length} playlists found.`
    );
    return response.data.items || [];
  } catch (error) {
    logDebug("Playlist URL: " + url);
    handleError(error, "fetching playlists");
    throw new Error("PlayListFetchError");
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
    totalQuotaUsed += QUOTA_COST.playlist; // Add quota cost for playlist creation
    logInfo(`Created new playlist: '${title}' with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    handleError(error, "Error creating playlist");
    throw new Error("PlayListCreateError");
  }
}

//Cache the results of previous searches and only perform a new search if the song is not already in the cache.
const searchCache = {};

/**
 * Search for multiple videos on YouTube using batch API calls
 * API Key is used for public access to the API (like searching public videos on YouTube).
 * @param {*} query
 * @returns
 */
async function searchVideos(songs) {
  const batchRequests = songs.map((song) => {
    if (searchCache[song]) {
      logInfo(`Using cached result for '${song}'`);
      return Promise.resolve(searchCache[song]);
    }

    const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(
      song
    )}&type=video&key=${API_KEY}`;

    logDebug(`Request URL: ${url}`);

    return axios
      .get(url)
      .then((response) => {
        const items = response.data.items || [];
        if (items.length > 0) {
          searchCache[song] = items[0].id.videoId; // Cache the result
          totalQuotaUsed += QUOTA_COST.search; // Add quota cost for search
          logInfo(`Found video for '${song}': ${items[0].snippet.title}`);
          return items[0].id.videoId;
        } else {
          logInfo(`No video found for '${song}'`);
          return null;
        }
      })
      .catch((error) => {
        handleError(error, "Error during video search " + song);
        throw new APIError("VideoSearchError", 500);
      });
  });

  return Promise.all(batchRequests); // Wait for all searches to complete
}

// Add videos to a playlist (batch operation)
// Batch multiple requests into a single API call, rather than sending separate requests for each video.
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

  // Sending a batch request
  const batch = youtube.newBatch();
  data.forEach((item) => {
    batch.add(
      youtube.playlistItems.insert({
        part: "snippet",
        resource: item,
      })
    );
  });

  try {
    const _response = await batch.execute();
    totalQuotaUsed += QUOTA_COST.playlist * data.length; // Add quota cost for adding videos to playlist
    logInfo(`Added ${data.length} videos to playlist (ID: ${playlistId})`);
  } catch (error) {
    handleError(error, "Error while adding to playlist ID " + playlistId);
    throw new APIError("PlayListSongAdditionError", 500);
  }
}

let recentVideos = {}; // Cache to track videos added recently

// Check if a video already exists in the playlist
// Before adding a video to the playlist, you can optimize checking whether the video already exists in the playlist by only checking if the video has been added in the last few days or if a certain amount of time has passed since the last check.
async function isVideoInPlaylist(playlistId, videoId) {
  if (recentVideos[videoId]) {
    return true; // Skip checking if the video is recently added
  }

  const url = `${BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}`;
  try {
    const response = await axios.get(url, { headers });
    const isVideoInPlaylist = response.data.items.some(
      (item) => item.snippet.resourceId.videoId === videoId
    );

    if (isVideoInPlaylist) {
      recentVideos[videoId] = true; // Mark as recently added
    }

    return isVideoInPlaylist;
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

    const videoIds = await searchVideos(songs);

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

    // Add videos to playlist in batch
    await addVideosToPlaylist(playlistId, videoIds);

    // Print quota usage summary
    logSummary(`Total Quota Used: ${totalQuotaUsed} units`);
    logSummary(`Quota breakdown:`);
    logSummary(
      `  Search requests: ${songs.length} requests x ${
        QUOTA_COST.search
      } units = ${songs.length * QUOTA_COST.search} units`
    );
    logSummary(
      `  Playlist operations (create/fetch/add): ${songs.length} requests x ${
        QUOTA_COST.playlist
      } units = ${songs.length * QUOTA_COST.playlist} units`
    );
    await checkQuota(API_KEY);
  } catch (error) {
    logError("An error occurred during playlist management:", error);
    await checkQuota(API_KEY);
  }
}

// Run the script after authorization
authorize(main);
