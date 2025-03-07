// Global Variables
let playlistDict = {}


// Reload every 59 minutes to renew Spotify Token
setInterval(function() {
    location.reload();
}, 3540000); 


/**
 * Function Name: updateCurrentlyPlaying
 * 
 * Description: Updates the currently playing track information by fetching data
 *              from Flask using the /getNewSongPlaying route
 * 
 * Parameters:
 *  - none
 * 
 * Returns:
 *  - none
 * 
 * Author: David Rogers
 */
function updateCurrentlyPlaying() {
    fetch('/getNewSongPlaying') 
        .then((response) => response.json())
        .then((data) => {
            // Update the page with the new song details
            document.getElementById('currentlyPlaying').innerHTML =
                'You are currently playing <b>' +
                data.playingTrack +
                '</b> by <b>' +
                data.playingArtist +
                '</b> on a <b>' +
                data.deviceType +
                '</b> called <b>' +
                data.deviceName +
                '</b>';
        })
        .catch((error) => {
            console.error('Error updating "Currently Playing":', error);
        });
}

// Update Currently Playing track information every 5sec
setInterval(updateCurrentlyPlaying, 5000);


/**
 * Function Name: sendArtist
 * 
 * Description: Get artist details from input box (artistName) and
 *              send them to Flask
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function sendArtist() {
    let artistToSearch = document.getElementById('artistName').value;

    // Turn on 'Searching...' overlay and turn off hidden sections
    turnOnSearchingOverlay();
    turnOffArtistSection();
    turnOffArtistAlbums();

    // Send artistName to Flask via a POST request to /searchArtists
    fetch('/searchArtists', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: artistToSearch }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success. Found a set of Artists');
            document.getElementById('artistName').value = '';
            showArtistSearchOverlay(data.artistsDict);
        })
        .catch((error) => {
            turnOffSearchingOverlay();
            console.error('Error searching for Artist:', error);
        });
};


/**
 * Function Name: showArtistSearchOverlay
 * 
 * Description: Build the Artist Search overlay from artist data
 *              received and turn it ON.
 * 
 * Parameters:
 *  - artists (Object): key(Index):value(Array - 0:Artist Name 1:Artist URI)
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function showArtistSearchOverlay(artists) {
    const artistSearchResultsList = document.getElementById('artistSearchResultsList');

    // Clear previous results
    artistSearchResultsList.innerHTML = '';

    // Create a list item for each result
    artistIndex = 1;
    for (const artist in artists) {
        const li = document.createElement('li');
        artistName = artists[artistIndex][0];
        li.textContent = artistName;
        li.onclick = () => selectArtistResult(artist, artists);
        artistSearchResultsList.appendChild(li);
        ++artistIndex;
    };

    // Show the overlay
    turnOnArtistSearchOverlay();
}


/**
 * Function Name: selectArtistResult
 * 
 * Description: Extract the artistURI and send to searchByArtistURI
 *              Turn off Artist Search Overlay
 * 
 * Parameters:
 *  - artistIndex (Integer): Selected index number in Artists object
 *  - artists (Object): key(Index):value(Array - 0:Artist Name 1:Artist URI) 
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function selectArtistResult(artistIndex, artists) {

    console.log('Selected result:', artistIndex);
    artistURI = artists[artistIndex][1];
    
    // Turn off the overlay after selection
    turnOffArtistSearchOverlay();

    searchByArtistURI(artistURI);
}


/**
 * Function Name: searchByArtistURI
 * 
 * Description: Fetch artist details from Flask and update
 *              page to display.
 * 
 * Parameters:
 *  - artistURI (String): Artist URI GUID
 *
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function searchByArtistURI(artistURI) {
    turnOnSearchingOverlay();
    fetch('/searchArtistByURI', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: artistURI }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success. Found the Artist ' + data.artistName);

            // Clear existing content before adding new data
            document.getElementById('artistAlbums').innerHTML = '';
            // Fill in the artistSection with new data
            document.querySelector('.artistCol1Heading').textContent = data.artistName
            document.querySelector('.artistImage').innerHTML = `<img src="${data.artistArt}" alt="Image of ${data.artistName}" style="width: 300px; height: 300px;">`
            document.querySelector('.artistInfo').innerHTML = `
                <p><strong>Followers:</strong> ${data.artistFollowers.toLocaleString()}</p>
                <p><strong>Genres:</strong></p>
                <ul>
                    ${data.artistGenres.map(genre => `<li>${genre}</li>`).join('')}
                </ul>
            `;
            displayArtistAlbums(data);
        })
        .catch((error) => {
            turnOffSearchingOverlay();
            console.error('Error searching for Artist:', error);
        });
}

/**
 * Function Name: displayArtistAlbums
 * 
 * Description: Display the Albums belonging to the target
 *              Artist. Include in each Album the Album Art,
 *              Tracks and Play, Queue and Add buttons for
 *              each track.
 * 
 * Parameters:
 *  - artistAlbumsDict (Object): Contains an object(albumsDict) within an
 *      object (artistAlbumsDict) - the internal object holds album track data,
 *      the external object contains Artist data.
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function displayArtistAlbums(artistAlbumsDict) {
            // Create a container to hold all the Artist's ablums
            const displayElement = document.getElementById('artistAlbums');

            // Create a container div to hold all albums
            const albumsContainer = document.createElement('div');
            albumsContainer.classList.add('albums-container'); // Add a class to style the container

            // Loop through albumsDict
            for (const albumKey in artistAlbumsDict.albumsDict) {
                if (artistAlbumsDict.albumsDict.hasOwnProperty(albumKey)) {
                    // Create a section for each album
                    const albumsDiv = document.createElement('div');
                    albumsDiv.classList.add('album'); // Add a class for each album item

                    // Access the album dictionary using albumKey
                    const albumData = artistAlbumsDict.albumsDict[albumKey];

                    // Display the album name as a heading
                    albumsDiv.innerHTML = `<h3>${albumData.albumName}</h3>`; // Display albumName as a heading

                    // Check if the albumData contains both 'albumName' and 'albumArt'
                    if (albumData.albumName && albumData.albumArt) {
                        // Display the album name as text
                        const albumNameElement = document.createElement('p');
                        albumsDiv.appendChild(albumNameElement);

                        // Create an <img> tag to display the album art
                        const albumArtElement = document.createElement('img');
                        albumArtElement.src = albumData.albumArt; // Set the src to the albumArt URL
                        albumArtElement.alt = `Album art for ${albumData.albumName}`;
                        albumArtElement.style.maxWidth = '300px';
                        albumArtElement.style.maxHeight = '300px';
                        albumArtElement.classList.add('albumArt')

                        // Append the image to the album section
                        albumsDiv.appendChild(albumArtElement);
                    }

                    // Check if the albumData contains tracks
                    if (albumData.tracks) {
                        // Create a list to hold the track numbers and names
                        const trackList = document.createElement('ul');

                        // Loop through the track dictionary and display each track
                        let trackNumber = 1; // Start numbering tracks from 1
                        for (const trackKey in albumData.tracks) {
                            if (albumData.tracks.hasOwnProperty(trackKey)) {
                                const track = albumData.tracks[trackKey]; // Access the track data

                                // Create a list item for each track
                                const trackListItem = document.createElement('li');
                                trackListItem.textContent = `${trackNumber}. ${track.trackName}`; // Numbered track name
                                
                                // Create the "Add" button for each track
                                const addButton = document.createElement('button');
                                addButton.textContent = 'Add'; // Button text
                                addButton.classList.add('plAddButton'); // Add a class for styling if necessary
                                addButton.setAttribute('plTrackID', track.trackID);
                                
                                // Create 'Play' button for each track
                                const playButton = document.createElement('button');
                                playButton.textContent = 'Play';
                                playButton.classList.add('trackPlayBtn');
                                playButton.setAttribute('trackPlayID', track.trackID);  
                                
                                // Create 'Queue' button for each track
                                const queueButton = document.createElement('button');
                                queueButton.textContent = 'Queue';
                                queueButton.classList.add('trackQueueBtn');
                                queueButton.setAttribute('trackQueueID', track.trackID); 

                                // Add event listener for add button
                                addButton.addEventListener('click', function() {
                                    // When clicked, send the track ID to Flask
                                    const trackID = addButton.getAttribute('plTrackID');
                                    addButtonPressed(trackID);
                                });

                                // Add event listener for play button
                                playButton.addEventListener('click', function() {
                                    // When clicked, send the track ID to Flask
                                    const trackID = playButton.getAttribute('trackPlayID');
                                    playButtonPressed(trackID);
                                });

                                // Add event listener for queue button
                                queueButton.addEventListener('click', function() {
                                    // When clicked, send the track ID to Flask
                                    const trackID = queueButton.getAttribute('trackQueueID');
                                    queueButtonPressed(trackID)
                                });

                                // Append the "Add" and "Play" buttons after the track name
                                trackListItem.appendChild(playButton);
                                trackListItem.appendChild(queueButton);
                                trackListItem.appendChild(addButton);

                                // Append the track list item to the list
                                trackList.appendChild(trackListItem);

                                trackNumber++; // Increment track number for next track
                            }
                        }

                        // Append the track list to the album section
                        albumsDiv.appendChild(trackList);
                    }

                    // Append the album section to the albums container
                    albumsContainer.appendChild(albumsDiv);
                }
            }

            // Append the albums container to the main display element
            displayElement.appendChild(albumsContainer);

            // Turn off 'searching...' overlay and turn on hidden sections
            turnOffSearchingOverlay();
            turnOnArtistSection();
            turnOnArtistAlbums();
        
}


/**
 * Function Name: addButtonPressed
 * 
 * Description: When ADD button is presses, send request to Flask
 *              route /getTrackData along with TrackURI and return 
 *              updated playlistDict playlistDict. Rebuild Playlist 
 *              based on new version of playlistDict.
 * 
 * Parameters:
 *  - trackID (String): track URI
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function addButtonPressed(trackID){
    // When clicked, send the track ID to Flask
    // console.log('Track ID to add:', trackID);
    
    // Send trackID to Flask via a POST request using Fetch API
    fetch('/getTrackData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackID: trackID }),  // Send trackID as JSON
    })
        .then((response) => response.json())
        .then((data) => {
            //console.log('Track info received:', data);
            
            // Use 'data' to start building playlistDict object
            let playlistIndex;
            if (Object.keys(playlistDict).length === 0) {
                playlistIndex = 1;
            } else {
                playlistIndex = Object.keys(playlistDict).length + 1;
            }
            playlistDict[playlistIndex] = data.playlistItem;
            //console.log('Add to Playlist: Index='+ playlistIndex + " " + playlistDict[playlistIndex]);  
            buildPlaylist(playlistDict);
            console.log('Success. Added track "' + data.playlistItem[1] + '" to the playlist')
        })
        .catch((error) => {
            console.error('Error adding track:', error);
    });
}


/**
 * Function Name: playButtonPressed
 * 
 * Description: When PLAY button is pressed, send TrackID to 
 *              Flask route /playTrack and receive confirmation
 *              that track is being played to active device
 * 
 * Parameters:
 *  - trackID (String): Track URI GUID
 * 
 * Returns:
 *  - None 
 * 
 * Author: David Rogers
 */
function playButtonPressed(trackID){
                                        
    // Send trackID to Flask via a POST request using Fetch API
    fetch('/playTrack', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackID: trackID }),  // Send trackID as JSON
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success. Playing "' + data.trackName + '" by ' + data.trackArtist);           
        })
        .catch((error) => {
            console.error('Error playing track:', error);
    });
}


/**
 * Function Name: queueButtonPressed
 * 
 * Description: Send TrackID to Flask route /queueTrack to 
 *              request Track be queued to play on active
 *              device. 
 * 
 * Parameters:
 *  - trackID (String): Track URI GUID
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function queueButtonPressed(trackID){
    
    fetch('/queueTrack', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackID: trackID }),  // Send trackID as JSON
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success. Queueing "' + data.trackName + '" by ' + data.trackArtist);    
        })
        .catch((error) => {
            console.error('Error queueing track:', error);
    })
}


/**
 * Function Name: sendSong
 * 
 * Description: Send the input value of songName to the Flask
 *              /searchSongs route, turn off the hidden 
 *              sections and turn on the 'Searching...' overlay
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function sendSong() {
    let songToSearch = document.getElementById('songName').value;
    turnOffArtistSection();
    turnOffArtistAlbums();
    turnOnSearchingOverlay();

    // Send inputValue to Flask via a POST request using Fetch API
    fetch('/searchSongs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: songToSearch }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success. Found a set of Songs');
            document.getElementById('songName').value = '';
            showSongsSearchOverlay(data.songsDict);

        })
        .catch((error) => {
            turnOffSearchingOverlay();
            console.error('Error searching for Song:', error);
        });
};


/**
 * Function Name: showSongsSearchOverlay
 * 
 * Description: Take the songs object and build the SongsSearchResultsList
 *              and display for the user to select a song from.
 * 
 * Parameters:
 *  - songs (Object): contains song Name, URI, its Album, song Artist name
 *              and the Album Image
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function showSongsSearchOverlay(songs) {
    const songsSearchResultsList = document.getElementById('songsSearchResultsList');

    // Clear previous results
    songsSearchResultsList.innerHTML = '';

    // Create an Array item for each result
    songIndex = 1;
    for (const [index, song] of Object.entries(songs)) {
        const li = document.createElement('li');
        const img = document.createElement('img');
        const container = document.createElement('div'); 
        const playButton = document.createElement('button');
        const queueButton = document.createElement('button');
        const addButton = document.createElement('button');
        
        const songName = song[0];
        const songURI = song[1];
        const songAlbumName = song[2];
        const songArtistName = song[4];
        const songAlbumImage = song[3];
        const songArtistURI = song[5];

        img.src = songAlbumImage;
        img.alt = `Image of ${songAlbumName}`;
        img.classList.add('songImage');  
    
        li.textContent = songName + ' By ' + songArtistName + ' From ' + songAlbumName;
        li.classList.add('songText');  
        
        addButton.type = 'button';
        addButton.textContent = 'Add';
        addButton.classList.add('addSong');
        addButton.onclick = () => selectSongResult(song);

        playButton.type = 'button';
        playButton.textContent = 'Play';
        playButton.classList.add('playSong');
        playButton.onclick = () => playButtonPressed(songURI);

        queueButton.type = 'button';
        queueButton.textContent = 'Queue';
        queueButton.classList.add('queueSong');
        queueButton.onclick = () => queueButtonPressed(songURI);

        container.appendChild(img);
        container.appendChild(li);    
        container.appendChild(playButton);
        container.appendChild(queueButton); 
        container.appendChild(addButton); 
        songsSearchResultsList.appendChild(container); 
        container.classList.add('songContainer');  
    
        ++songIndex;
    };

    // Show the overlay
    turnOffSearchingOverlay();
    turnOnSongsSearchOverlay();
}


/**
 * Function Name: selectSongResult
 * 
 * Description: Extract data from received 'song' and send it
 *              to searchBySongURI
 * 
 * Parameters:
 *  - song (Array): Song array containing song Name, URI, Artist
 *              name and Artist URI. 
 * 
 * Returns:
 *  - None 
 * 
 * Author: David Rogers
 */
function selectSongResult(song) {

    //console.log('Selected result:', song);
    songName = song[0];
    songURI = song[1];
    songArtistName = song[4];
    artistURI = song[5];
    
    // Turn off the Search List Overlay and turn on
    // 'Searching...' overlay.
    turnOffSongsSearchOverlay();
    turnOffArtistSection();
    turnOffArtistAlbums();
    turnOnSearchingOverlay();
    searchBySongURI(songName, songArtistName, songURI, artistURI);
}


/**
 * Function Name: searchBySongURI
 * 
 * Description: Send details to Flask route /searchArtistByURI
 *              and receive an updated playlistDict. Rebuild
 *              the playlist based on updated playlistDict.
 * 
 * Parameters:
 *  - songName (String): Name of selected song
 *  - songArtistName (String): Name of song's artist
 *  - songURI (String): Songs URI GUID
 *  - artistURI (String): Artists URI GUID
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
// Function to fetch Artist details from Flask and display
function searchBySongURI(songName, songArtistName, songURI, artistURI) {
    
    // Get the artist details to render
    fetch('/searchArtistByURI', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: artistURI }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success. Found the Artist');
            // Turn off 'searching...' overlay
            turnOffSearchingOverlay();
            // Render the remainder of the page
            turnOnArtistSection();

            // Clear existing content before adding new data
            document.getElementById('artistAlbums').innerHTML = '';
            // Fill in the artistSection with new data
            document.querySelector('.artistCol1Heading').textContent = data.artistName
            document.querySelector('.artistImage').innerHTML = `<img src="${data.artistArt}" alt="Image of ${data.artistName}" style="width: 300px; height: 300px;">`
            document.querySelector('.artistInfo').innerHTML = `
                <p><strong>Followers:</strong> ${data.artistFollowers.toLocaleString()}</p>
                <p><strong>Genres:</strong></p>
                <ul>
                    ${data.artistGenres.map(genre => `<li>${genre}</li>`).join('')}
                </ul>
            `;
            //let playlistDict = {};
            if (Object.keys(playlistDict).length === 0) {
                playlistIndex = 1;
            } else {
                playlistIndex = Object.keys(playlistDict).length + 1;
            }
            playlistDict[playlistIndex] = [songURI, songName, songArtistName];  
            buildPlaylist(playlistDict);
            console.log('Success. Added "' + songName + '" to Playlist.')
        })
        .catch((error) => {
            turnOffSearchingOverlay();
            console.error('Error searching for song by URI:', error);
        });
};


/**
 * Function Name: closeArtistSearchOverlay
 * 
 * Description: Turn off the 'Searching...' overlay and the
 *              ArtistSearch overlay.
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function closeArtistSearchOverlay() {
    turnOffArtistSearchOverlay();
    turnOffSearchingOverlay();
};


/**
 * Function Name: closeSongsSearchOverlay
 * 
 * Description: Turn off the Songs Search overlay and the
 *              Searching... overlay
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function closeSongsSearchOverlay() {
    turnOffSongsSearchOverlay();
    turnOffSearchingOverlay();
};


/**
 * Function Name: turnOnArtistAlbums
 * 
 * Description: Un-hide the ArtistAlbums section of the
 *              webpage. 
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOnArtistAlbums() {
    const artistAlbums = document.getElementById("artistAlbums");
    artistAlbums.style.display = "block";
    // console.log('turn On Artist Albums');
};


/**
 * Function Name: turnOffArtistAlbums
 * 
 * Description: Hide the ArtistAlbums section of the page.
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOffArtistAlbums() {
    const artistAlbums = document.getElementById("artistAlbums");
    artistAlbums.style.display = "none";
    // console.log('turn Off Artist Albums');
};


/**
 * Function Name: turnOnArtistSection
 * 
 * Description: Un-hide the Artist Section of the web page.
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOnArtistSection() {
    const artistSection = document.getElementById("artist");
    artistSection.style.display = "block";
    // console.log('turn On Artist Section');
};


/**
 * Function Name: turnOffArtistSection
 * 
 * Description: Hide the Artist section of the web page.
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOffArtistSection() {
    const artistSection = document.getElementById("artist");
    artistSection.style.display = "none";
    // console.log('turn Off Artist Section');
};


/**
 * Function Name: turnOnSearchingOverlay
 * 
 * Description: Turn ON the Searching... overlay
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOnSearchingOverlay() {
    const searchingOverlay = document.getElementById("searchingOverlay");
    searchingOverlay.style.display = "flex";
    // console.log('turn On Searching Overlay');
};


/**
 * Function Name: turnOffSearchingOverlay
 * 
 * Description: Turn off the Searching.. overlay.
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOffSearchingOverlay() {
    const searchingOverlay = document.getElementById("searchingOverlay");
    searchingOverlay.style.display = "none";
    // console.log('turn Off Searching Overlay');
};


/**
 * Function Name: turnOnSongsSearchOverlay
 * 
 * Description: Turn ON the Songs Search Overlay so users 
 *              can make selection.
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOnSongsSearchOverlay() {
    const songsSearchOverlay = document.getElementById('songsSearchOverlay');
    songsSearchOverlay.style.display = 'flex';
    // console.log('turn On Songs Search Overlay');
};


/**
 * Function Name: turnOffSongsSearchOverlay
 * 
 * Description: Turn OFF the Songs Search Overlay after users
 *              have made their selection
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
// Function to turn OFF SongsSearchOverlay
function turnOffSongsSearchOverlay() {
    const songsSearchOverlay = document.getElementById('songsSearchOverlay');
    songsSearchOverlay.style.display = 'none';
    // console.log('turn Off Songs Search Overlay');
};


/**
 * Function Name: turnOnArtistSearchOverlay
 * 
 * Description: Turn ON the Artists Search Overlay so users
 *              can make their selection.
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOnArtistSearchOverlay() {
    const artistSearchOverlay = document.getElementById('artistSearchOverlay');
    artistSearchOverlay.style.display = 'flex';
    // console.log('turn On Artist Search Overlay');
};


/**
 * Function Name: turnOffArtistSearchOverlay
 * 
 * Description: Turn OFF the Artist Search Overlay after users
 *              have made their selection
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function turnOffArtistSearchOverlay() {
    const artistSearchOverlay = document.getElementById('artistSearchOverlay');
    artistSearchOverlay.style.display = 'none';
    // console.log('turn Off Artist Search Overlay');
};


/**
 * Function Name: buildPlayList
 * 
 * Description: Use the received playlistDict to build a new
 *              version of the Playlist Builder section of the
 *              webpage. Create a Delete button for each track
 *              added to the Playlist. 
 * 
 * Parameters:
 *  - playlistDict (Object): Object containing key(Index):value(array)
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function buildPlaylist(playlistDict) {
    // Get the div with the class 'playlist'
    const playlistSection = document.getElementById('playlist');
    
    // Clear any existing content in the playlist div
    playlistSection.innerHTML = '';

    // Loop through the received object 
    for (const id in playlistDict) {
        if (playlistDict.hasOwnProperty(id)) {
            // Create a new div to hold the track names for this id
            const trackDiv = document.createElement('div');
            trackDiv.classList.add('plTracks'); 

            // Get the array of tracks for this id
            const tracks = playlistDict[id];
            
            const trackContainer = document.createElement('div');
            trackContainer.classList.add('plTrack'); 

            const trackNameElement = document.createElement('p');
            trackNameElement.classList.add('plTrackName');
            trackNameElement.textContent = tracks[1] + ' by ' + tracks[2]; 

            // Create a delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('deleteBtn'); 

            // Add an event listener to the delete button
            deleteButton.addEventListener('click', () => {
                trackDiv.remove();
                deleteFromPlaylist(tracks[1])
            });

            // Append the track name and delete button to the track container
            trackContainer.appendChild(trackNameElement);
            trackContainer.appendChild(deleteButton);

            // Append the track container to the track div
            trackDiv.appendChild(trackContainer);
            
            // Append the track div to the playlist section
            playlistSection.appendChild(trackDiv);
        }
    }
    
    //console.log(Object.entries(playlistDict))
    
}


/**
 * Function Name: clearPL
 * 
 * Description: Reset the current Playlist and run the 
 *              buildPlaylist command to clear the section
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function clearPL() {
    playlistDict = {};
    buildPlaylist(playlistDict);
};


/**
 * Function Name: deleteFromPlaylist
 * 
 * Description: Receive a Track Name and delete its track 
 *              information from the Playlist. Rebuild the
 *              remaining playlist info. Renumber the index
 *              keys for the remaining track items
 * 
 * Parameters:
 *  - trackToDelete (String): Name of track to be deleted
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function deleteFromPlaylist(trackToDelete) {
    // Iterate through the dictionary and search for the target trackName
    for (const key in playlistDict) {
        if (playlistDict.hasOwnProperty(key)) {
            // Check if the trackName matches the target name
            const track = playlistDict[key];
            
            if (track[1] === trackToDelete) {
                console.log('Delete from playlistDict: Index=' + key + ' ' + track);
                // If the trackName matches, removes that trackID and trackName from the array
                playlistDict[key].splice(0, 2);  // 
    
                // Delete the key from the playlistDict
                delete playlistDict[key];
    
                break;  // Exit the loop after deleting the track
            }
        }
    }
    // Re-number the keys to match index
    keys = Object.keys(playlistDict);
    newKey = 1;
    for (const [key, value] of Object.entries(playlistDict)) {
        if (newKey != key){
            setNewKeyForValue(playlistDict, value, newKey)
        }
        ++newKey;
    };
    
    // rebuild index of playlistDict
    buildPlaylist(playlistDict);
};


/**
 * Function Name: setNewKeyForValue
 * 
 * Description: When key is found out-of-order, e.g. 1,2,4,5
 *              then re-number remaining items, e.g. 1,2,3,4
 * 
 * Parameters:
 *  - obj (Object): The Object to be re-indexed
 *  - oldValue (Integer): The current value of the index to be
 *              renumbered.
 *  - newValue (Integer): The new value to be give to the object
 *              element to be re-indexed.
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function setNewKeyForValue(obj, oldValue, newKey) {
    for (let [key, value] of Object.entries(obj)) {
      if (value === oldValue) {
        obj[newKey] = oldValue;  // Set the new key
        delete obj[key];         // Remove the old key
        break;                   // Exit once the value is found
      }
    }
  }


  /**
 * Function Name: createPlaylist
 * 
 * Description: Prompt the user for a Playlist Name and 
 *              description and then pass current contents
 *              of playlistDict with the chosen Name and 
 *              description to Flask route /createPlaylist
 *              for processing
 * 
 * Parameters:
 *  - None
 * 
 * Returns:
 *  - None
 * 
 * Author: David Rogers
 */
function createPlaylist() {
    let playlist = {};
    let uris = [];
    
    if (playlistDict == {}) {
        alert('You have no items in your playlist');
        return;
    }
    
    let playlistName = window.prompt('Enter a Name for your playlist:');
    if (playlistName === '') {
        playlistName = 'Generic Playlist';
    }
    
    let playlistDesc = window.prompt('Enter a Description for your playlist called ' + playlistName);
    if (playlistDesc === '') {
        playlistDesc = 'A Playlist';
    }
    
    playlist.name = playlistName;
    playlist.desc = playlistDesc;
    for (const key in playlistDict) {
        const track = playlistDict[key];
        uris.push(track[0]);
    } 
    playlist.uris = uris;
    
    // Send playlist to Flask via a POST request using Fetch API
    fetch('/createPlaylist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playlist: playlist }),  // Send playlist object as JSON
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success: Playlist '+ playlistName +' created.');
            alert('Playlist successfully created!');
            clearPL();
        })
        .catch((error) => {
            console.error('Error adding playlist:', error);
    });
};

