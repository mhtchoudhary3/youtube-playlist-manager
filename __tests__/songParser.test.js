import { FileNotFoundError } from '../src/songParser';

import parseSongList from '../src/songParser';
import fs from 'fs';
import { jest } from '@jest/globals';

// Mocking process.exit to prevent the test from exiting unexpectedly
jest.mock('process', () => ({
  exit: jest.fn(),
}));

// Mocking fs.readFileSync explicitly
jest.spyOn(fs, 'readFileSync');

describe('parseSongList', () => {
  it('should parse songs from a file and remove extensions', () => {
    // Arrange: Mock the file content
    const mockFileContent =
      'Shape of You.mp3\nRolling in the Deep.mp4\nHotel California.mp3\n';

    // Mock fs.readFileSync to return the mock content
    fs.readFileSync.mockReturnValue(mockFileContent);

    // Act: Call the function with a dummy file path
    const result = parseSongList('songs.txt');

    // Assert: Check if the function returns the correct parsed song list
    expect(result).toEqual([
      'Shape of You',
      'Rolling in the Deep',
      'Hotel California',
    ]);
  });

  it('should return an empty array if the file is empty', () => {
    // Arrange: Mock an empty file content
    fs.readFileSync.mockReturnValue('');

    // Act: Call the function with an empty file
    const result = parseSongList('empty_songs.txt');

    // Assert: The result should be an empty array
    expect(result).toEqual([]);
  });

  it('should handle file with extra spaces or empty lines', () => {
    // Arrange: Mock file content with extra spaces and empty lines
    const mockFileContent =
      '   Shape of You.mp3  \n\n  Rolling in the Deep.mp4\n\n  \nHotel California.mp3\n';
    fs.readFileSync.mockReturnValue(mockFileContent);

    // Act: Call the function
    const result = parseSongList('songs_with_spaces.txt');

    // Assert: It should trim spaces and remove empty lines
    expect(result).toEqual([
      'Shape of You',
      'Rolling in the Deep',
      'Hotel California',
    ]);
  });

  it('should return an array with unique songs', () => {
    // Arrange: Mock file content with duplicate songs
    const mockFileContent =
      'Shape of You.mp3\nShape of You.mp3\nHotel California.mp3\n';
    fs.readFileSync.mockReturnValue(mockFileContent);

    // Act: Call the function
    const result = parseSongList('duplicate_songs.txt');

    // Assert: The result should contain only unique songs
    expect(result).toEqual(['Shape of You', 'Hotel California']);
  });

  it('should throw a FileNotFoundError if the file does not exist', () => {
    // Arrange: Make fs.readFileSync throw a "File not found" error
    fs.readFileSync.mockImplementation(() => {
      const error = new Error('File not found');
      error.code = 'ENOENT'; // Simulate the file not found error code
      throw error;
    });

    // Act & Assert: Call the function and check for the specific error
    expect(() => parseSongList('non_existent.txt')).toThrowError(
      new FileNotFoundError('non_existent.txt'),
    );

    // Optionally, check for the exact error message
    // expect(() => parseSongList("non_existent.txt")).toThrow("File not found: non_existent.txt");
  });

  it('should throw a generic error if there is an issue reading the file', () => {
    // Arrange: Make fs.readFileSync throw a generic error (other than ENOENT)
    fs.readFileSync.mockImplementation(() => {
      throw new Error('Generic file read error');
    });

    // Act & Assert: Call the function and check that the error is thrown
    expect(() => parseSongList('generic_error.txt')).toThrowError(
      'Failed to parse song list from file: generic_error.txt',
    );
  });
});
