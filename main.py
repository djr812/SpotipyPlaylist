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
client_id = '84d9b0df0f934959bcaccd4dacc166c8'
client_secret = 'c660934a81d74d30a75a195af8dc6c05'

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=client_id,
                                               client_secret=client_secret,
                                               redirect_uri="http://localhost:5000",
                                               scope="user-library-read"))

user = sp.current_user()

# print(json.dumps(user, sort_keys=True, indent=4))

#print(json.dumps(VARIABLE, sort_keys=True, indent=4))

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
        "index.html", displayName=displayName, followers=followers,
    )


@app.route('/searchArtist', methods=['POST'])
def process_data():
    # Extract the input value from the request
    artist_name = request.json.get('input')
    
    # Do something with the input value (e.g., process it, store it, etc.)
    searchResults = sp.search(artist_name,1,0,"artist")
    artist = searchResults['artists']['items'][0]
    artistName = artist['name']
    artistFollowers = artist['followers']['total']
    artistGenre = artist['genres'][0]
    artistID = artist['id']
    artistArt = artist['images'][0]['url']

    # Album and Track details
    trackURIs = []
    trackArt = []
    albumDict = {}
    albumsDict = {}
    i = 0

    albumResults = sp.artist_albums(artistID)
    albumResults = albumResults['items']

    # Build a dict (albumsDict) that contains each individual 
    # album dictionary (albumDict)
    for item in albumResults:  
        albumDict = {}  # Initialize a new albumDict for each item
        
        albumDict['albumName'] = item['name']
        albumDict['albumID'] = item['id']
        albumDict['albumArt'] = item['images'][0]['url']
        i += 1
        # Use the albumID as the key in albumsDict
        albumsDict[i] = albumDict

    # Respond back with a message (could be any response you want)
    return jsonify({
        'artistName':artistName,
        'artistFollowers':artistFollowers,
        'artistGenre':artistGenre,
        'artistArt':artistArt,
        'albumsDict':albumsDict,
        'message': f'You sent: {artist_name}'}), 200

if __name__ == "__main__":
    app.run(debug=True)