import fs from "fs";
import { logError, logInfo } from "./logging.js";

/**
 * Custom error for file not found.
 */
class FileNotFoundError extends Error {
  constructor(filePath) {
    super(`File not found: ${filePath}`);
    this.name = "FileNotFoundError";
    this.filePath = filePath;
  }
}

/**
 * Function to parse the song list from a file and remove file extensions
 * @param {string} filePath - Path to the song list file
 * @returns {Array} - Array of unique song names without extensions
 */
export default function parseSongList(filePath) {
  try {
    // Read the raw data from the file
    const rawData = fs.readFileSync(filePath, "utf-8");

    // Split the data by new lines, trim each line, remove file extensions, and filter out any empty lines
    const songs = rawData
      .split(/\r?\n/) // Split by newline
      .map((song) => song.trim()) // Trim whitespace
      .map((song) => song.replace(/\.[a-zA-Z0-9]+$/, "")) // Remove file extensions (e.g., .mp4, .mp3)
      .filter((song) => song); // Filter out empty lines

    logInfo(`Parsed ${songs.length} songs from '${filePath}'`);

    // Return unique song names (set removes duplicates)
    return [...new Set(songs)];
  } catch (error) {
    if (error.code === "ENOENT") {
      // If file not found, throw a specific custom error
      throw new FileNotFoundError(`${filePath}`);
    } else {
      // Handle other types of errors (e.g., file read issues, parsing issues)
      logError(
        `Error reading or parsing the song list from file: ${filePath}`,
        error
      );
      throw new Error(`Failed to parse song list from file: ${filePath}`); // Re-throw a generic error for other cases
    }
  }
}

export { FileNotFoundError };
