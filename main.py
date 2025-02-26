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
scope = 'user-library-read,user-read-playback-state,user-modify-playback-state'

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
playingArtist = track['item']['artists'][0]['name']
playingTrack = track['item']['name']

displayName = user['display_name']
followers = user['followers']['total']



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
        "index.html", displayName=displayName, followers=followers, playingArtist=playingArtist, playingTrack=playingTrack, 
    )


@app.route('/getNewSongPlaying')
def getNewSongPlaying():
    # Get current track information
    songPlaying = {}
    track = sp.current_user_playing_track()

    playingArtist = track['item']['artists'][0]['name']
    playingTrack = track['item']['name']

    songPlaying = {'playingArtist': playingArtist, 'playingTrack': playingTrack}
    return jsonify(songPlaying)


@app.route('/searchArtist', methods=['POST'])
def searchArtist():
    # Extract the artistName from the request
    getArtistName = request.json.get('input')
    
    # Search Spotify for the artistName
    searchResults = sp.search(getArtistName,1,0,"artist")

    # Extract data from searchResults
    artist = searchResults['artists']['items'][0]
    artistName = artist['name']
    artistFollowers = artist['followers']['total']
    if artist['genres'] != []:
        artistGenre = artist['genres'][0]
    else:
        artistGenre = ""
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
        'artistGenre':artistGenre,
        'artistArt':artistArt,
        'albumsDict':albumsDict,
        'message': f'You sent: {getArtistName}'}), 200

if __name__ == "__main__":
    app.run(debug=True)