# YouTube Playlist Manager

This Node.js script allows you to create a YouTube playlist from a list of songs and automatically add them using the YouTube Data API.

## Features:
- Authenticate with OAuth 2.0 to access the YouTube Data API.
- Check if a playlist already exists by listing your existing playlists.
- Create a new playlist if it doesn't exist.
- Search for songs on YouTube using the text file and add them to the playlist.

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
   -  Create OAuth 2.0 credentials and download the credentials.json file.
   -  Rename this file to client_secret.json and place it in the root directory of this project.

4. Create the configuration file:

   -  Create a file named `config.json` in the root directory and add your API key and OAuth access token (you can get the access token after OAuth authentication).

      ```json
      {
      "api_key": "YOUR_YOUTUBE_API_KEY",
      "access_token": "YOUR_OAUTH_ACCESS_TOKEN"
      }
      ```

4. Create the Required Files:
   - `songs.txt`: You can add the song data in any format, and the code will attempt to parse it into the appropriate format. However, the recommended approach is to add one song title per line. For example:
      ```txt
      Shape of You
      Rolling in the Deep
      Hotel California
      ```

## Usage
### Authenticate and Run the Script
1. Authenticate: Run the script to authenticate and generate your OAuth token.

   ```bash
   node auth.js
   ```

2. Run the main script: Execute the script to manage your playlist.
   ```bash
   node index.js
   ```

    This will:

      - Check if the playlist exists.
      - Create the playlist if it doesn't.
      - Parse the song list from songs.txt.
      - Search for videos on YouTube and add them to the playlist.
      
## Project Structure
```graphql
youtube-playlist-manager/
├── client_secret.json        # OAuth 2.0 client secrets file (download from Google Developer Console)
├── config.json              # Configuration file containing API key and OAuth token
├── songs.txt                # List of songs to search for and add to the playlist
├── index.js                 # Main script to manage playlist and add videos
├── auth.js                  # Script to authenticate with Google OAuth 2.0
├── package.json             # Project dependencies and metadata
├── package-lock.json        # Locked versions of dependencies
└── README.md                # This readme file
```



## Future Scope:
A web integration to add authenticate user accounts into it and directly create a playlist for them.