const fs = require("fs");
const axios = require("axios");
const authorize = require("./auth");

const config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
const API_KEY = config.api_key;
const ACCESS_TOKEN = config.access_token;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

const headers = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

// Function to parse the song list from a file
function parseSongList(filePath) {
  const rawData = fs.readFileSync(filePath, "utf-8");
  const songs = rawData.split(/\r?\n/).map((song) => song.trim()).filter((song) => song);
  return [...new Set(songs)]; // Remove duplicates
}

// Fetch playlists from the authenticated user
async function getPlaylists() {
  const url = `${BASE_URL}/playlists?part=snippet&mine=true`;
  const response = await axios.get(url, { headers });
  return response.data.items || [];
}

// Create a new playlist
async function createPlaylist(title, description) {
  const data = {
    snippet: { title, description },
    status: { privacyStatus: "public" },
  };
  const url = `${BASE_URL}/playlists?part=snippet,status`;
  const response = await axios.post(url, data, { headers });
  return response.data.id;
}

// Search for a video on YouTube
async function searchVideo(query) {
  const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;
  const response = await axios.get(url);
  const items = response.data.items || [];
  return items.length > 0 ? items[0].id.videoId : null;
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
  await axios.post(url, data, { headers });
}

// Main function to manage the playlist and add videos
async function main() {
  const playlistTitle = "My New Playlist";
  const playlistDescription = "A playlist created from a text list of songs";
  let playlistId = null;

  const playlists = await getPlaylists();
  for (const playlist of playlists) {
    if (playlist.snippet.title === playlistTitle) {
      playlistId = playlist.id;
      console.log(`Playlist '${playlistTitle}' already exists. ID: ${playlistId}`);
      break;
    }
  }

  if (!playlistId) {
    playlistId = await createPlaylist(playlistTitle, playlistDescription);
    console.log(`Created Playlist. ID: ${playlistId}`);
  }

  const songs = parseSongList("songs.txt");

  for (const song of songs) {
    const videoId = await searchVideo(song);
    if (videoId) {
      await addVideoToPlaylist(playlistId, videoId);
      console.log(`Added '${song}' to the playlist.`);
    } else {
      console.log(`No video found for '${song}'.`);
    }
  }
}

// Run the script after authorization
authorize(main);
