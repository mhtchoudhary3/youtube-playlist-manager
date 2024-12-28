import os
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# List of song files (with .mp4 extension)
song_list = [
    "A thousand miles.mp4", "Jabse dil - Yeh dil aashiqana.mp4", "Sarphiri - Laila majnu.mp4",
    "AA chal ke tujhe.mp4", "Jaine kaise - raqeeb.mp4", "Sathiya tune kya kiya.mp4",
    "Aa chaliye.mp4", "Jala sain.mp4", "Save your tears - The weekend.mp4",
    "Aa jao na.mp4", "Jeete hain chal- neeraja.mp4", "See you again.mp4",
    # Add all songs here...
]

# Clean up song names
def clean_song_title(song):
    return song.replace(".mp4", "").strip()

cleaned_songs = [clean_song_title(song) for song in song_list]

# YouTube API authentication
API_NAME = "youtube"
API_VERSION = "v3"
CLIENT_SECRETS_FILE = "credentials.json"  # Replace with your own path
SCOPES = ["https://www.googleapis.com/auth/youtube.force-ssl"]

def authenticate_youtube():
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
    credentials = flow.run_local_server(port=0)
    youtube = build(API_NAME, API_VERSION, credentials=credentials)
    return youtube

# Create playlist
def create_playlist(youtube, title, description):
    request = youtube.playlists().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": description
            },
            "status": {
                "privacyStatus": "public"  # Change to 'private' or 'unlisted' if needed
            }
        }
    )
    response = request.execute()
    return response['id']

# Search for video
def search_video(youtube, query):
    request = youtube.search().list(
        part="snippet",
        q=query,
        type="video",
        maxResults=1
    )
    response = request.execute()
    if response["items"]:
        return response["items"][0]["id"]["videoId"]
    return None

# Add video to playlist
def add_video_to_playlist(youtube, playlist_id, video_id):
    request = youtube.playlistItems().insert(
        part="snippet",
        body={
            "snippet": {
                "playlistId": playlist_id,
                "resourceId": {
                    "kind": "youtube#video",
                    "videoId": video_id
                }
            }
        }
    )
    request.execute()

# Main script
youtube = authenticate_youtube()
playlist_id = create_playlist(youtube, "My Music Playlist", "A playlist created from a list of songs")

for song in cleaned_songs:
    video_id = search_video(youtube, song)
    if video_id:
        add_video_to_playlist(youtube, playlist_id, video_id)
        print(f"Added {song} to playlist")
    else:
        print(f"Could not find video for: {song}")
