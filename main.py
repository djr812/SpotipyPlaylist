import requests
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, jsonify
from dotenv import load_dotenv
import os
import json
import spotipy
from spotipy.oauth2 import SpotifyOAuth


load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
application = app

# Spotify credentials
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
scope = 'user-library-read,user-read-playback-state,user-modify-playback-state,playlist-modify-public'

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=client_id,
                                               client_secret=client_secret,
                                               redirect_uri="http://localhost:5000",
                                               scope=scope))

user = sp.current_user()

# print(json.dumps(user, sort_keys=True, indent=4))

#print(json.dumps(VARIABLE, sort_keys=True, indent=4))

# Get currently playing device
devices = sp.devices()
deviceID = devices['devices'][0]['id']

# Get current track information
track = sp.current_user_playing_track()
if track != None:
    playingArtist = track['item']['artists'][0]['name']
    playingTrack = track['item']['name']
    deviceName = devices['devices'][0]['name']
    deviceType = devices['devices'][0]['type']
else:
    playingArtist = "nobody"
    playingTrack = "nothing"
    deviceName = "nada"
    deviceType = "unknown device"

displayName = user['display_name']
followers = user['followers']['total']

# Functionality to create and add items to playlist

# Initialize an empty dictionary to hold playlist track IDs
playlistDict = {}

@app.route("/")
def index():
    """
    Name:       index
    Desc:       Trigger building of index.html and pass
                relevant data
    Params:     None
    Returns     render_template
    """
    return render_template(
        "index.html", displayName=displayName, followers=followers, playingArtist=playingArtist, playingTrack=playingTrack, deviceName=deviceName, deviceType=deviceType, 
    )


@app.route('/getNewSongPlaying')
def getNewSongPlaying():
    # Get current track information
    songPlaying = {}
    track = sp.current_user_playing_track()
    devices = sp.devices()
    if track != None:
        playingArtist = track['item']['artists'][0]['name']
        playingTrack = track['item']['name']
        deviceName = devices['devices'][0]['name']
        deviceType = devices['devices'][0]['type']   
    else:
        playingArtist = "nobody"
        playingTrack = "nothin'"
        deviceName = "nada"
        deviceType = "unknown device"
     
    songPlaying = {'playingArtist': playingArtist, 'playingTrack': playingTrack, 'deviceName': deviceName, 'deviceType': deviceType}
    return jsonify(songPlaying)


@app.route('/searchArtist', methods=['POST'])
def searchArtist():
    # Extract the artistName from the request
    getArtistName = request.json.get('input')
    
    # Search Spotify for the artistName
    searchResults = sp.search(getArtistName,1,0,"artist")

    # Extract data from searchResults
    artistGenres = []

    artist = searchResults['artists']['items'][0]
    artistName = artist['name']
    artistFollowers = artist['followers']['total']
    if artist['genres'] != []:
        artistGenres = artist['genres']
    else:
        artistGenres = []
    artistID = artist['id']
    if artist['images'] != []:
        artistArt = artist['images'][0]['url']
    else:
        artistArt = ""

    # Album and Track details
    albumsDict = {}
    i = 0
    
    albumResults = sp.artist_albums(artistID)
    albumResults = albumResults['items']

    # Build a dict (albumsDict) that contains each individual album dictionary (albumDict)
    # and each album dictionary contains a dictionary of tracks
    for item in albumResults:
        albumDict = {}  # Initialize a new albumDict for each item
        albumID = item['id']
        
        albumDict['albumName'] = item['name']
        albumDict['albumID'] = item['id']
        albumDict['albumArt'] = item['images'][0]['url']
        albumDict['tracks'] = {}  # Dictionary to hold tracks for the album
        
        trackResults = sp.album_tracks(albumID)
        trackResults = trackResults['items']

        for track in trackResults:
            trackDict = {}
            trackID = track['uri']

            trackDict['trackID'] = trackID
            trackDict['trackName'] = track['name']

            albumDict['tracks'][trackID] = trackDict  # Add the track to the albumDict under 'tracks' with the trackID as the key

        albumsDict[albumID] = albumDict  # Add the albumDict to albumsDict with albumID as the key


    # Respond back with a message (could be any response you want)
    return jsonify({
        'artistName':artistName,
        'artistFollowers':artistFollowers,
        'artistGenres':artistGenres,
        'artistArt':artistArt,
        'albumsDict':albumsDict,
        'message': f'You sent: {getArtistName}'}), 200


@app.route('/getTrackData', methods=['POST'])
def getTrackData():
    playlistItem = []
    # Get the JSON data from the incoming request
    data = request.get_json()
    
    # Extract the trackID from the data
    playlistTrackID = data.get('trackID')
    #playlistTrackID = playlistTrackID[14:]
    
    if playlistTrackID:
        #plistIndex = len(playlistDict)+1
        
        # Get the track name
        playlistTrackName, playlistArtist = getTrackName(playlistTrackID)

        # Add trackID and trackName to an array to return 
        playlistItem = [playlistTrackID, playlistTrackName, playlistArtist]

        # Respond with a success message
        return jsonify({"message": "Track info received", "playlistItem": playlistItem}), 200
    else:
        # Handle the case where trackID is not provided
        return jsonify({"message": "Track ID not provided"}), 400


@app.route('/createPlaylist', methods=['POST'])
def createPlaylist():
    # Get the JSON data from the incoming request
    data = request.get_json()
    playlist = data.get('playlist')

    playlistName = playlist.get('name')
    playlistDesc = playlist.get('desc')
    uris = playlist.get('uris')
    userID = user["id"]

    if (playlistName and playlistDesc and userID):
        playlistID = createPlaylistContainer(playlistName, playlistDesc, userID)
        fillPlaylistContainer(playlistID, uris, userID)
        return jsonify({"message": "Playlist info received for playlist ", "playlistName": playlistName}), 200
    else:
        return jsonify({"message": "Playlist data not provided"}), 400


@app.route('/playTrack', methods=['POST'])
def playTrack():
    data = request.get_json()
    trackID = data.get('trackID')
    # Get currently playing device
    devices = sp.devices()
    #print(devices['devices'])
    if not devices['devices'][0]['is_active']:
        deviceID = ['devices'][0]['id']
        sp.transfer_playback(deviceID, force_play=True) 
        sp.start_playback(uris=[trackID])
    else:
        sp.start_playback(uris=[trackID])
    
    devices = sp.devices()

    if (data and devices['devices'][0]['is_active']):
        return jsonify({"message": "Playing track ", "trackID": trackID}), 200
    else:
        return jsonify({"message": "Unable to play Track"}), 400


def createPlaylistContainer(playlistName, playlistDesc, userID):
    # Request playlist container be created
    playlistDetails = sp.user_playlist_create(userID, playlistName, public=True, description=playlistDesc)
    playlistID = playlistDetails['id']
    return playlistID


def fillPlaylistContainer(playlistID, uris, userID):
    # Add tracks to the playlist
    sp.user_playlist_add_tracks(userID, playlistID, uris)
    return


def getTrackName(plTrackID):
    trackSearch = sp.track(plTrackID, 'AU')
    plTrackName = trackSearch["name"]
    trackSearch = trackSearch["artists"]
    plTrackArtist = trackSearch[0]["name"]
    return plTrackName, plTrackArtist


if __name__ == "__main__":
    app.run(debug=True)