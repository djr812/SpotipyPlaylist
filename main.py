import requests
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, jsonify
#from dotenv import load_dotenv
import os
import json
import spotipy
from spotipy.oauth2 import SpotifyOAuth


#load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")
application = app

# Spotify credentials
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
scope = "user-library-read,user-read-playback-state,user-modify-playback-state,playlist-modify-public"

sp_oauth = SpotifyOAuth(
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri="http://127.0.0.1:5000/callback",
        scope=scope
    )


# Initialize an empty dictionary to hold playlist track IDs
playlistDict = {}
# Initialize Authorization tokens
code = ""
sp = ""


@app.route("/")
def index():
    """
    Name:       index
    Desc:       Trigger building of index.html and pass
                relevant data
    Params:     None
    Returns:    render_template with attached data
    """
    global code
    global sp
    if not code:
        # Get the authorization URL
        auth_url = sp_oauth.get_authorize_url()

        # Redirect the user to Spotify's authorization page
        return redirect(auth_url)

    user = sp.current_user()

    # print(json.dumps(VARIABLE, sort_keys=True, indent=4))

    # Get currently playing device
    devices = sp.devices()
    deviceID = devices["devices"][0]["id"]

    # Get current track information
    track = sp.current_user_playing_track()
    if track != None:
        playingArtist = track["item"]["artists"][0]["name"]
        playingTrack = track["item"]["name"]
        deviceName = devices["devices"][0]["name"]
        deviceType = devices["devices"][0]["type"]
    else:
        playingArtist = "nobody"
        playingTrack = "nothing"
        deviceName = "nada"
        deviceType = "unknown device"

    displayName = user["display_name"]
    followers = user["followers"]["total"]


    return render_template(
        "index.html",
        displayName=displayName,
        followers=followers,
        playingArtist=playingArtist,
        playingTrack=playingTrack,
        deviceName=deviceName,
        deviceType=deviceType
    )


@app.route('/callback')
def callback():
    global code
    global sp
    # Get the authorization code from the URL query parameter
    
    code = request.args.get('code')

    if not code:
        return "Error: No authorization code found", 400

    # Use the code to get an access token
    token_info = sp_oauth.get_access_token(code)

    if not token_info:
        return "Error: Unable to get access token", 400

    # Now you have access to the token, and you can use the Spotify API
    access_token = token_info['access_token']
    sp = spotipy.Spotify(auth=access_token)

    return redirect(url_for('index'))


@app.route("/getNewSongPlaying")
def getNewSongPlaying():
    """
    Name:       getNewSongPlaying
    Desc:       Get data using Spotipy regarding currently
                playing track on device
    Params:     None
    Returns:    Return jsonified data regarding currently
                playing track on device
    """
    try:
        # Get current track information
        songPlaying = {}

        track = sp.current_user_playing_track()
        devices = sp.devices()

        if track is not None:
            playingArtist = track["item"]["artists"][0]["name"]
            playingTrack = track["item"]["name"]
            deviceName = devices["devices"][0]["name"]
            deviceType = devices["devices"][0]["type"]
        else:
            playingArtist = "nobody"
            playingTrack = "nothin'"
            deviceName = "nada"
            deviceType = "unknown device"

        songPlaying = {
            "playingArtist": playingArtist,
            "playingTrack": playingTrack,
            "deviceName": deviceName,
            "deviceType": deviceType,
        }

        return jsonify(songPlaying)

    except Exception as e:
        # In case of any error, return the error message as JSON
        error_details = {
            "error": str(e),
            "message": "An error occurred while fetching current song playing data.",
        }
        return jsonify(error_details), 500


@app.route("/searchArtists", methods=["POST"])
def searchArtists():
    """
    Name:       searchArtists
    Desc:       Receive Artist Name or part of Name and send to
                Spotipy API search function. Build the artistsDict
                dictionary with search results and return to JS
    Params:     input(POST)
    Returns:    artistDict
    """
    # Extract the artistName from the request
    getArtistName = request.json.get("input")

    # Search Spotify for the top 10 matches to entered getArtistName
    searchResults = sp.search(getArtistName, 10, 0, "artist")

    # Extract data from searchResults

    artistIndex = 0
    artistsDict = {}

    artists = searchResults["artists"]["items"]

    for artist in artists:
        artistDetails = []
        artistName = searchResults["artists"]["items"][artistIndex]["name"]
        artistDetails.append(artistName)
        artistURI = searchResults["artists"]["items"][artistIndex]["uri"]
        artistDetails.append(artistURI)
        artistIndex += 1
        artistsDict[artistIndex] = artistDetails

    # Respond back with artistsDict
    return (
        jsonify({"artistsDict": artistsDict, "message": f"You sent: {getArtistName}"}),
        200,
    )


@app.route("/searchArtistByURI", methods=["POST"])
def searchArtistByURI():
    """
    Name:       searchArtistByURI
    Desc:       Receive artistURI input and send to Spotipy Artist function
                to return artist information. Use artistURI to return their
                associated Albums and Tracks. Format all data and return to JS
    Params:     input[POST]
    Returns:    artistName (String)
                artistFollowers (Integer)
                artistGenres (Array)
                artistArt (String)
                albumsDict (Dictionary)
    """

    getArtistURI = request.json.get("input")

    artistDetails = sp.artist(getArtistURI)

    artistGenres = []
    artistName = artistDetails["name"]
    artistFollowers = artistDetails["followers"]["total"]
    if artistDetails["genres"] != []:
        artistGenres = artistDetails["genres"]
    else:
        artistGenres = []
    artistID = getArtistURI
    if artistDetails["images"] != []:
        artistArt = artistDetails["images"][0]["url"]
    else:
        artistArt = ""

    # Album and Track details
    albumsDict = {}
    i = 0

    albumResults = sp.artist_albums(artistID)
    albumResults = albumResults["items"]

    # Build a dict (albumsDict) that contains each individual album dictionary (albumDict)
    # and each album dictionary contains a dictionary of tracks
    for item in albumResults:
        albumDict = {}  # Initialize a new albumDict for each item
        albumID = item["id"]

        albumDict["albumName"] = item["name"]
        albumDict["albumID"] = item["id"]
        albumDict["albumArt"] = item["images"][0]["url"]
        albumDict["tracks"] = {}  # Dictionary to hold tracks for the album

        trackResults = sp.album_tracks(albumID)
        trackResults = trackResults["items"]

        for track in trackResults:
            trackDict = {}
            trackID = track["uri"]

            trackDict["trackID"] = trackID
            trackDict["trackName"] = track["name"]

            albumDict["tracks"][
                trackID
            ] = trackDict  # Add the track to the albumDict under 'tracks' with the trackID as the key

        albumsDict[albumID] = (
            albumDict  # Add the albumDict to albumsDict with albumID as the key
        )

    # # Respond back with a message (could be any response you want)
    return (
        jsonify(
            {
                "artistName": artistName,
                "artistFollowers": artistFollowers,
                "artistGenres": artistGenres,
                "artistArt": artistArt,
                "albumsDict": albumsDict,
                "message": f"You sent: {artistName}",
            }
        ),
        200,
    )


@app.route("/searchSongs", methods=["POST"])
def searchSongs():
    """
    Name:       searchSongs
    Desc:       Receive input (song Name) and send to Spotipy
                search function to receive top 5 matches. Process
                returned songs into Arrays of songDetails and
                append these to a dictionary called songsDict.
    Params:     input(POST)
    Returns:    songsDict (Dictionary)
    """
    # Extract the artistName from the request
    getSongName = request.json.get("input")

    # Search Spotify for the top 5 matches to entered getSongName
    searchResults = sp.search(getSongName, 5, 0, "track", "AU")
    # print(json.dumps(searchResults, sort_keys=True, indent=4))
    # Extract data from searchResults

    songIndex = 0
    songsDict = {}

    songs = searchResults["tracks"]["items"]

    for song in songs:
        songDetails = []
        songName = searchResults["tracks"]["items"][songIndex]["name"]
        songDetails.append(songName)
        songURI = searchResults["tracks"]["items"][songIndex]["uri"]
        songDetails.append(songURI)
        songAlbumName = searchResults["tracks"]["items"][songIndex]["album"]["name"]
        songDetails.append(songAlbumName)
        songAlbumImage = searchResults["tracks"]["items"][songIndex]["album"]["images"][
            2
        ]["url"]
        songDetails.append(songAlbumImage)
        songArtistName = searchResults["tracks"]["items"][songIndex]["artists"][0][
            "name"
        ]
        songDetails.append(songArtistName)
        songArtistURI = searchResults["tracks"]["items"][songIndex]["artists"][0]["uri"]
        songDetails.append(songArtistURI)
        songIndex += 1
        songsDict[songIndex] = songDetails

    # print (songsDict)

    # Respond back with artistsDict
    return jsonify({"songsDict": songsDict, "message": f"You sent: {getSongName}"}), 200


@app.route("/getTrackData", methods=["POST"])
def getTrackData():
    """
    Name:       getTrackData
    Desc:       Receives a trackID (URI) and returns a playlistItem which
                is an array containing the track URI, track name and
                the artist.
    Params:     data(POST)
    Returns:    playlistItem (Array)
    """
    playlistItem = []
    # Get the JSON data from the incoming request
    data = request.get_json()

    # Extract the trackID from the data
    playlistTrackID = data.get("trackID")
    # playlistTrackID = playlistTrackID[14:]

    if playlistTrackID:
        # plistIndex = len(playlistDict)+1

        # Get the track name
        playlistTrackName, playlistArtist = getTrackName(playlistTrackID)

        # Add trackID and trackName to an array to return
        playlistItem = [playlistTrackID, playlistTrackName, playlistArtist]

        # Respond with a success message
        return (
            jsonify({"message": "Track info received", "playlistItem": playlistItem}),
            200,
        )
    else:
        # Handle the case where trackID is not provided
        return jsonify({"message": "Track ID not provided"}), 400


@app.route("/createPlaylist", methods=["POST"])
def createPlaylist():
    """
    Name:       createPlaylist
    Desc:       Receive Playlist Name, Desc, URI's and UserID and
                then create a Playlist container and Fill the container
                with received URI's
    Params:     playlist(Dictionary)
    Returns:    Confirmation Message in JSON
    """
    # Get the JSON data from the incoming request
    data = request.get_json()
    playlist = data.get("playlist")

    playlistName = playlist.get("name")
    playlistDesc = playlist.get("desc")
    uris = playlist.get("uris")
    userID = user["id"]

    if playlistName and playlistDesc and userID:
        playlistID = createPlaylistContainer(playlistName, playlistDesc, userID)
        fillPlaylistContainer(playlistID, uris, userID)
        return (
            jsonify(
                {
                    "message": "Playlist info received for playlist ",
                    "playlistName": playlistName,
                }
            ),
            200,
        )
    else:
        return jsonify({"message": "Playlist data not provided"}), 400


@app.route("/playTrack", methods=["POST"])
def playTrack():
    """
    Name:       playTrack
    Desc:       Receives a track ID (URI), starts play on the active
                device or transfers to a non-active device and forces
                playback. Returns a trackID (URI) and confirmation
                message.
    Params:     data(POST)
    Returns:    trackID (String)
    """
    data = request.get_json()
    trackID = data.get("trackID")
    trackName, trackArtist = getTrackName(trackID)
    # Get currently playing device
    devices = sp.devices()
    if not devices["devices"][0]["is_active"]:
        deviceID = devices["devices"][0]["id"]
        sp.transfer_playback(deviceID, force_play=True)
        sp.start_playback(uris=[trackID])
    else:
        sp.start_playback(uris=[trackID])

    devices = sp.devices()

    if data and devices["devices"][0]["is_active"]:
        return (
            jsonify(
                {
                    "message": "Playing track ",
                    "trackID": trackID,
                    "trackName": trackName,
                    "trackArtist": trackArtist,
                }
            ),
            200,
        )
    else:
        return jsonify({"message": "Unable to play Track"}), 400


@app.route("/queueTrack", methods=["POST"])
def queueTrack():
    """
    Name:       queueTrack
    Desc:       Receives a track ID (URI) and checks for a currently
                active and playing device. If none are present then
                force play on the next available device, otherwise
                queue the track on the active device.
    Params:     data(POST)
    Returns:    trackID (String)
    """
    data = request.get_json()
    trackID = data.get("trackID")
    trackName, trackArtist = getTrackName(trackID)
    # Get currently playing device
    devices = sp.devices()
    # print(devices)
    if not devices["devices"][0]["is_active"]:
        # return jsonify({"message": "Unable to queue Track"}), 400
        deviceID = devices["devices"][0]["id"]
        sp.transfer_playback(deviceID, force_play=True)
        sp.start_playback(uris=[trackID])
    else:
        sp.add_to_queue(trackID)
        return (
            jsonify(
                {
                    "message": "Queueing track ",
                    "trackID": trackID,
                    "trackName": trackName,
                    "trackArtist": trackArtist,
                }
            ),
            200,
        )


def createPlaylistContainer(playlistName, playlistDesc, userID):
    """
    Name:       createPlaylistContainer
    Desc:       Received a playlist Name, Desc and the user's ID
                and creates a container for the playlist ready for
                addition of tracks
    Params:     playlistName (String)
                playlistDesc (String)
                userID (String)
    Returns:    playlistID (String)
    """
    # Request playlist container be created
    playlistDetails = sp.user_playlist_create(
        userID, playlistName, public=True, description=playlistDesc
    )
    playlistID = playlistDetails["id"]
    return playlistID


def fillPlaylistContainer(playlistID, uris, userID):
    """
    Name:       fillPlaylistContainer
    Desc:       Takes the user's ID and playlist ID and
                an array of URI's (Track ID's) and adds
                them to the identified playlist.
    Params:     userID (String)
                playlistID (String)
                uris (Array)
    Returns:    None
    """
    # Add tracks to the playlist
    sp.user_playlist_add_tracks(userID, playlistID, uris)
    return


def getTrackName(plTrackID):
    """
    Name:       getTrackName
    Desc:       Receives a playlist TrackID (URI) and
                returns its Track Name and Artist
    Params:     plTrackID (String)
    Returns:    plTrackName (String)
                plTrackArtist (String)
    """
    trackSearch = sp.track(plTrackID, "AU")
    plTrackName = trackSearch["name"]
    trackSearch = trackSearch["artists"]
    plTrackArtist = trackSearch[0]["name"]
    return plTrackName, plTrackArtist


if __name__ == "__main__":
    app.run(debug=True)
