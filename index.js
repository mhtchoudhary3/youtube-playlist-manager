import fs from 'fs';
import axios from 'axios';
import  authorize  from './auth.js';
import { logError, logInfo, logDebug, logSummary } from './logging.js';  // Importing logging 
import dotenv from 'dotenv';
dotenv.config();  // Load environment variables from .env file

const playlistTitle = "My New Playlist";
const playlistDescription = "A playlist created from a text list of songs";

/**
 * API Key is used for public access to the API (like searching public videos on YouTube).
 * OAuth 2.0 is used for accessing user-specific data, such as private playlists, uploaded videos, or managing content.
 */


let oAuthTokenConfig;
let ACCESS_TOKEN ;
let BASE_URL;
let headers ;
const API_KEY = process.env.YOUTUBE_API_KEY;

// Function to parse the song list from a file and remove file extensions
function parseSongList(filePath) {
  try {
    // Read the raw data from the file
    const rawData = fs.readFileSync(filePath, "utf-8");

    // Split the data by new lines, trim each line, remove file extensions, and filter out any empty lines
    const songs = rawData
      .split(/\r?\n/)  // Split by newline
      .map((song) => song.trim())  // Trim whitespace
      .map((song) => song.replace(/\.[a-zA-Z0-9]+$/, ''))  // Remove file extensions (e.g., .mp4, .mp3)
      .filter((song) => song);  // Filter out empty lines

    logInfo(`Parsed ${songs.length} songs from '${filePath}'`);
    
    // Return unique song names (set removes duplicates)
    return [...new Set(songs)];
  } catch (error) {
    logError(`Error reading or parsing the song list from file: ${filePath}`, error);
    process.exit(1);
  }
}


// Fetch playlists from the authenticated user
async function getPlaylists() {
  const url = `${BASE_URL}/playlists?part=snippet&mine=true`;
  try {
    const response = await axios.get(url, { headers });
    logInfo(`Fetched playlists: ${response.data.items.length} playlists found.`);
    return response.data.items || [];
  } catch (error) {
    logDebug("Playlist URL: "+ url);
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
    if (error.response && error.response.data.error.code === 403 && error.response.data.error.errors[0].reason === "quotaExceeded") {
      logError("Quota exceeded. You have exceeded the daily API quota limit.");
      // TODO: retry logic or wait until the quota is reset
      return null;
    }else {

    logError("Error creating playlist", error);
    throw error; // Rethrow to stop execution
    }
  }
}
/**
 * Search for a video on YouTube
 * API Key is used for public access to the API (like searching public videos on YouTube).
 * @param {*} query 
 * @returns 
 */
async function searchVideo(query) {
  const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;
  logInfo(`Request URL: ${url}`);

  try {
    //TODO: Print url as debug logs
    const response = await axios.get(url);
    const items = response.data.items || [];
    if (items.length > 0) {
      logInfo(`Found video for '${query}': ${items[0].snippet.title}`);
      return items[0].id.videoId;
    } else {
      logInfo(`No video found for '${query}'`);
      return null;
    }
  } catch (error) {
    if (error.response && error.response.data.error.code === 403 && error.response.data.error.errors[0].reason === "quotaExceeded") {
      logError("Quota exceeded. You have exceeded the daily API quota limit.");
      // TODO: retry logic or wait until the quota is reset
    }else {
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
  }
}

// Add a video to a playlist
async function addVideoToPlaylist(playlistId, videoId) {
  const data = {
    snippet: {
      playlistId,
      resourceId: {
        kind: "youtube#video",
        videoId,
      },
    },
  };
  const url = `${BASE_URL}/playlistItems?part=snippet`;
  try {
    await axios.post(url, data, { headers });
    logInfo(`Added video (ID: ${videoId}) to playlist (ID: ${playlistId})`);
  } catch (error) {
    if (error.response && error.response.data.error.code === 403 && error.response.data.error.errors[0].reason === "quotaExceeded") {
      logError("Quota exceeded. You have exceeded the daily API quota limit.");
      // TODO: retry logic or wait until the quota is reset
    }else {
    logError(`Error adding video (ID: ${videoId}) to playlist (ID: ${playlistId})`, error);
    }
  }
}

// Main function to manage the playlist and add videos
async function main() {
try {
  oAuthTokenConfig = JSON.parse(fs.readFileSync("OAuthToken.json", "utf8"));
  logInfo("Successfully loaded token file.");
} catch (error) {
  logError("Error reading or parsing OAuthToken.json:", error);
  process.exit(1);  // Exit the process if OAuthToken.json cannot be loaded
}

 ACCESS_TOKEN = oAuthTokenConfig.access_token;
 BASE_URL = "https://www.googleapis.com/youtube/v3";

 if (!API_KEY){
  logError("API Key is missing in OAuthToken.json");
  process.exit(1);
 }
  if (!ACCESS_TOKEN){
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
        logInfo(`Playlist '${playlistTitle}' already exists. ID: ${playlistId} & playlistTitle: ${playlistTitle}`);
        break;
      }
    }

    if (!playlistId) {
      playlistId = await createPlaylist(playlistTitle, playlistDescription);
      logInfo(`Created new playlist. ID: ${playlistId} & playlistTitle: ${playlistTitle}`);
    }

    const songs = parseSongList("songs.txt");

    // Track the counters
    let existingSongsCount = 0;
    let newSongsCount = 0;
    let failedSongsCount = 0;

    for (const song of songs) {
      const videoId = await searchVideo(song);
      if (videoId) {
        const isInPlaylist = await isVideoInPlaylist(playlistId, videoId);
        if (isInPlaylist) {
          logInfo(`Song '${song}' already exists in the playlist.`);
          existingSongsCount++;
        } else {
          await addVideoToPlaylist(playlistId, videoId);
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

  } catch (error) {
    logError("An error occurred during playlist management:" , error);
  }
}

// Run the script after authorization
authorize(main);
