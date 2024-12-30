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
   -  Create OAuth 2.0 credentials and download the `credentials.json` file.
   -  Rename this file to `client_secret.json` and place it in the root directory of this project.

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
- `Web Interface Integration`: Develop a web-based interface to allow users to authenticate their accounts and create playlists directly on YouTube.

    - A user-friendly UI for entering YouTube API credentials, or alternatively, integrating a login feature to authenticate users directly via their Google account.
    - Provide an interface to input raw song data, automatically process the list using AI (such as ChatGPT) to filter and refine the song search. Users will then be able to interact with the results—dragging and selecting songs before adding them to the playlist.

- `Publish to npm`: Publish the project as a reusable npm package for easy installation and use by others.

- `Add Support for ReasonML and TypeScript`: Extend the project by integrating support for ReasonML and TypeScript, enhancing its flexibility and developer experience.