// import  parseSongList  from "../src/songParser";
const parseSongList = require('../src/songParser');
// import fs from "fs";
const fs = require('fs');

// Mocking fs.readFileSync to avoid reading actual files during tests
jest.mock("fs");

describe("parseSongList", () => {
  it("should parse songs from a file and remove extensions", () => {
    // Arrange: Mock the file content
    const mockFileContent =
      "Shape of You.mp3\nRolling in the Deep.mp4\nHotel California.mp3\n";
    fs.readFileSync.mockReturnValue(mockFileContent);

    // Act: Call the function with a dummy file path
    const result = parseSongList("songs.txt");

    // Assert: Check if the function returns the correct parsed song list
    expect(result).toEqual([
      "Shape of You",
      "Rolling in the Deep",
      "Hotel California",
    ]);
  });

  it("should return an empty array if the file is empty", () => {
    // Arrange: Mock an empty file content
    fs.readFileSync.mockReturnValue("");

    // Act: Call the function with an empty file
    const result = parseSongList("empty_songs.txt");

    // Assert: The result should be an empty array
    expect(result).toEqual([]);
  });

  it("should handle file with extra spaces or empty lines", () => {
    // Arrange: Mock file content with extra spaces and empty lines
    const mockFileContent =
      "   Shape of You.mp3  \n\n  Rolling in the Deep.mp4\n\n  \nHotel California.mp3\n";
    fs.readFileSync.mockReturnValue(mockFileContent);

    // Act: Call the function
    const result = parseSongList("songs_with_spaces.txt");

    // Assert: It should trim spaces and remove empty lines
    expect(result).toEqual([
      "Shape of You",
      "Rolling in the Deep",
      "Hotel California",
    ]);
  });

  it("should return an array with unique songs", () => {
    // Arrange: Mock file content with duplicate songs
    const mockFileContent =
      "Shape of You.mp3\nShape of You.mp3\nHotel California.mp3\n";
    fs.readFileSync.mockReturnValue(mockFileContent);

    // Act: Call the function
    const result = parseSongList("duplicate_songs.txt");

    // Assert: The result should contain only unique songs
    expect(result).toEqual(["Shape of You", "Hotel California"]);
  });

  it("should throw an error if the file does not exist or cannot be read", () => {
    // Arrange: Make fs.readFileSync throw an error
    fs.readFileSync.mockImplementation(() => {
      throw new Error("File not found");
    });

    // Act & Assert: Call the function and check for error handling
    expect(() => parseSongList("non_existent.txt")).toThrow("File not found");
  });
});
