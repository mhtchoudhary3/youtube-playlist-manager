import fs from 'fs';
import axios from 'axios';
import  authorize  from './auth.js';


let config;
try {
  config = JSON.parse(fs.readFileSync("config.json", "utf8"));
  console.log("Successfully loaded token file.");
} catch (error) {
  console.error("Error reading or parsing config.json:", error);
  process.exit(1);  // Exit the process if config.json cannot be loaded
}

const API_KEY = config.api_key;
const ACCESS_TOKEN = config.access_token;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

const headers = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

// Function to parse the song list from a file
function parseSongList(filePath) {
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const songs = rawData.split(/\r?\n/).map((song) => song.trim()).filter((song) => song);
    console.log(`Parsed ${songs.length} songs from '${filePath}'`);
    return [...new Set(songs)]; // Remove duplicates
  } catch (error) {
    console.error(`Error reading or parsing the song list from file: ${filePath}`, error);
    process.exit(1);
  }
}

// Fetch playlists from the authenticated user
async function getPlaylists() {
  const url = `${BASE_URL}/playlists?part=snippet&mine=true`;
  try {
    const response = await axios.get(url, { headers });
    console.log(`Fetched playlists: ${response.data.items.length} playlists found.`);
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching playlists", error);
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
    console.log(`Created new playlist: '${title}' with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error("Error creating playlist", error);
    throw error; // Rethrow to stop execution
  }
}

// Search for a video on YouTube
async function searchVideo(query) {
  const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;
  try {
    const response = await axios.get(url);
    const items = response.data.items || [];
    if (items.length > 0) {
      console.log(`Found video for '${query}': ${items[0].snippet.title}`);
      return items[0].id.videoId;
    } else {
      console.log(`No video found for '${query}'`);
      return null;
    }
  } catch (error) {
    console.error(`Error searching for video: '${query}'`, error);
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
    console.log(`Added video (ID: ${videoId}) to playlist (ID: ${playlistId})`);
  } catch (error) {
    console.error(`Error adding video (ID: ${videoId}) to playlist (ID: ${playlistId})`, error);
  }
}

// Main function to manage the playlist and add videos
async function main() {
  const playlistTitle = "My New Playlist";
  const playlistDescription = "A playlist created from a text list of songs";
  let playlistId = null;

  try {
    const playlists = await getPlaylists();
    for (const playlist of playlists) {
      if (playlist.snippet.title === playlistTitle) {
        playlistId = playlist.id;
        console.log(`Playlist '${playlistTitle}' already exists. ID: ${playlistId} & playlistTitle: ${playlistTitle}`);
        break;
      }
    }

    if (!playlistId) {
      playlistId = await createPlaylist(playlistTitle, playlistDescription);
      console.log(`Created new playlist. ID: ${playlistId} & playlistTitle: ${playlistTitle}`);
    }

    const songs = parseSongList("songs.txt");

    for (const song of songs) {
      const videoId = await searchVideo(song);
      if (videoId) {
        await addVideoToPlaylist(playlistId, videoId);
        console.log(`Added '${song}' to the playlist.`);
      } else {
        console.log(`Skipping '${song}', no video found.`);
      }
    }

  } catch (error) {
    console.error("An error occurred during playlist management:", error);
  }
}

// Run the script after authorization
authorize(main);
