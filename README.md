# YouTube Playlist Manager

This Node.js script allows you to create a YouTube playlist from a list of songs and automatically add them using the YouTube Data API.

## Features:

- **OAuth 2.0 Authentication**: Securely authenticate to access the YouTube Data API.
- **Playlist Existence** & Creation: Automatically check if a playlist exists by listing your current playlists, and create a new one if it doesn't.
- **Song Search & Addition**: Search for songs on YouTube using a provided text file and add them to the playlist.Search for songs on YouTube using the text file and add them to the playlist.
- **Batch Playlist Operations**: Reduce API calls by sending multiple insert requests in a single batch, improving performance when adding videos to playlists.
- **Efficient Song Search**: Minimize API calls by grouping multiple song searches into a single request or optimizing search queries for better efficiency.
- **Quota Management**: Track API quota usage to avoid exceeding limits. Implement retry mechanisms with backoff strategies and limit requests during high-traffic periods to ensure smooth operation.
- **Optimized Playlist Management**

## Project Setup

### Prerequisites

- **Node.js** (>= v14.x.x)
- **npm** (or `yarn`)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/mhtchoudhary3/youtube-playlist-manager.git
   cd youtube-playlist-manager
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Google API credentials:

   - Go to the Google Developer Console.
   - Create a new project.
   - Enable the YouTube Data API v3.
   - Create OAuth 2.0 credentials and download the `credentials.json` file.
   - Rename this file to `client_secret.json` and place it in the root directory of this project.

4. Set Up API Key (for YouTube Data API):

   - Create a .env file in the root directory of your project (this file will store your sensitive information like the API Key).

     - Add the following line in the .env file:

       ```text
       YOUTUBE_API_KEY=your_api_key_here
       ```

       Replace your_api_key_here with the actual API key you obtained.

   - Create a YouTube API Key:
     - Go to the Google Developer Console.
     - Navigate to Credentials, then click Create Credentials and select API Key.
     - Copy the API Key.

5. Create the Required Files:
   - `songs.txt`: You can add the song data in any format, and the code will attempt to parse it into the appropriate format. However, the recommended approach is to add one song title per line. For example:
     ```txt
     Shape of You.mp3
     Rolling in the Deep.mp4
     Hotel California.mp3
     ```

## Usage

### Authenticate and Run the Script

1. Run the main script: Execute the script to manage your playlist.

   ```bash
   node index.js
   ```

   This will:

   - Authenticate and generate your OAuth token.
   - Check if the playlist exists.
   - Create the playlist if it doesn't.
   - Parse the song list from songs.txt.
   - Search for videos on YouTube and add them to the playlist.

## Project Structure

```graphql
youtube-playlist-manager/
├── client_secret.json       # OAuth 2.0 client secrets file (download from Google Developer Console)
├── OAuthTokenConfig.json    # Configuration file containing API key and OAuth token
├── .env                     # Environment file containing sensitive credentials like API keys
├── songs.txt                # List of songs to search for and add to the playlist
├── index.js                 # Main script to manage playlist and add videos
├── package.json             # Project dependencies and metadata
├── package-lock.json        # Locked versions of dependencies
└── README.md                # This readme file

# Source code
└── src/
    ├── auth.js                # Script to authenticate with Google OAuth 2.0
    ├── logging.js             # Script for logging utility
    ├── songParser.js          # Script that contains the song parsing logic

# Tests
└── tests/
    ├── songParser.test.js     # Jest unit tests for the song parsing logic (songParser.js)
```

## Quota Information

### Note:

- Quota per project per day: 10,000 quota units per day for free-tier users.
- These 10,000 quota units are shared across all API requests made by your project.

### Example of quota usage:

- **Search** (for videos, playlists, channels): **100 units** per request.
- **Playlist operations** (create, list, insert items): **50 units** per request.
- **Video operations** (get video details, rate video): **1 unit per** request.
- **Channel operations** (get channel info, subscriptions): **1 unit** per request.

## Future Scope:

- `Web Interface Integration`: Develop a web-based interface to allow users to authenticate their accounts and create playlists directly on YouTube.

  - A user-friendly UI for entering YouTube API credentials, or alternatively, integrating a login feature to authenticate users directly via their Google account.
  - Provide an interface to input raw song data, automatically process the list using AI (such as ChatGPT) to filter and refine the song search. Users will then be able to interact with the results—dragging and selecting songs before adding them to the playlist.

- `Publish to npm`: Publish the project as a reusable npm package for easy installation and use by others.

- `Add Support for ReasonML and TypeScript`: Extend the project by integrating support for ReasonML and TypeScript, enhancing its flexibility and developer experience.
