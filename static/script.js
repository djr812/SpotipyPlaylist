let playlistDict = {}

setInterval(function () {
    fetch('/getNewSongPlaying') // Call your Flask route /getNewSongPlaying to get fresh song info
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
        });
}, 5000); // Every 5000 milliseconds (5 seconds)

function sendArtist() {
    let artistToSearch = document.getElementById('artistName').value;

    turnOnSearchingOverlay();
    turnOffArtistSection();
    turnOffArtistAlbums();

    // Send inputValue to Flask via a POST request using Fetch API
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
};

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


// Function to handle selection of a search result
function selectArtistResult(artistIndex, artists) {

    console.log('Selected result:', artistIndex);
    artistURI = artists[artistIndex][1];
    
    // Turn off the overlay after selection
    turnOffArtistSearchOverlay();

    searchByArtistURI(artistURI);
}

// Function to fetch Artist details from Flask and display
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
            console.log('Success. Found the Artist');

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
                     
            const displayElement = document.getElementById('artistAlbums');

            // Create a container div to hold all albums
            const albumsContainer = document.createElement('div');
            albumsContainer.classList.add('albums-container'); // Add a class to style the container

            // Loop through albumsDict
            for (const albumKey in data.albumsDict) {
                if (data.albumsDict.hasOwnProperty(albumKey)) {
                    // Create a section for each album
                    const albumsDiv = document.createElement('div');
                    albumsDiv.classList.add('album'); // Add a class for each album item

                    // Access the album dictionary using albumKey
                    const albumData = data.albumsDict[albumKey];

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
                                
                                // Store the track ID in the button's data attribute
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

                                // Add event listener for when the button is clicked
                                addButton.addEventListener('click', function() {
                                    // When clicked, send the track ID to Flask
                                    const trackID = addButton.getAttribute('plTrackID');
                                    console.log('Track ID to add:', trackID);
                                    
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
                                            console.log('Track info received:', data);
                                            
                                            // Use 'data' to start building playlistDict object
                                            let playlistIndex;
                                            if (Object.keys(playlistDict).length === 0) {
                                                playlistIndex = 1;
                                            } else {
                                                playlistIndex = Object.keys(playlistDict).length + 1;
                                            }
                                            playlistDict[playlistIndex] = data.playlistItem;
                                            console.log('Add to Playlist: Index='+ playlistIndex + " " + playlistDict[playlistIndex]);  
                                            buildPlaylist(playlistDict);
                                        })
                                        .catch((error) => {
                                            console.error('Error adding track:', error);
                                    });
                                });

                                // Add event listener for when the button is clicked
                                playButton.addEventListener('click', function() {
                                    // When clicked, send the track ID to Flask
                                    const trackID = playButton.getAttribute('trackPlayID');
                                    console.log('Track ID to play:', trackID);
                                    
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
                                            console.log('Track play info received:', data);
                                            
                                        })
                                        .catch((error) => {
                                            console.error('Error adding track:', error);
                                    });
                                });
                                
                                // Add event listener for when the button is clicked
                                queueButton.addEventListener('click', function() {
                                    // When clicked, send the track ID to Flask
                                    const trackID = queueButton.getAttribute('trackQueueID');
                                    console.log('Track ID to queue:', trackID);
                                    
                                    // Send trackID to Flask via a POST request using Fetch API
                                    fetch('/queueTrack', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ trackID: trackID }),  // Send trackID as JSON
                                    })
                                        .then((response) => response.json())
                                        .then((data) => {
                                            console.log('Track queue info received:', data);
                                            
                                        })
                                        .catch((error) => {
                                            console.error('Error queueing track:', error);
                                    });
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

            // Turn off 'searching...' overlay and turn on hidden section
            turnOffSearchingOverlay();
            turnOnArtistSection();
            turnOnArtistAlbums();
        })
        .catch((error) => {
            turnOffSearchingOverlay();
            console.error('Error:', error);
        });
}

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
};


function showSongsSearchOverlay(songs) {
    const songsSearchResultsList = document.getElementById('songsSearchResultsList');

    // Clear previous results
    songsSearchResultsList.innerHTML = '';

    // Create a list item for each result
    songIndex = 1;
    for (const song in songs) {
        const li = document.createElement('li');
        const img = document.createElement('img');
        const container = document.createElement('div'); 
    
        songName = songs[songIndex][0];
        songAlbumName = songs[songIndex][2];
        songArtistName = songs[songIndex][4];
        songAlbumImage = songs[songIndex][3];
        songArtistURI = songs[songIndex][5];
        
        img.src = songAlbumImage;
        img.alt = `Image of ${songAlbumName}`;
        img.classList.add('songImage');  
    
        li.textContent = songName + ' By ' + songArtistName + ' From ' + songAlbumName;
        li.classList.add('songText'); 
        li.onclick = () => selectSongResult(song, songs); 
        
        container.appendChild(img);
        container.appendChild(li);      
        songsSearchResultsList.appendChild(container); 
    
        container.classList.add('songContainer');  
    
        ++songIndex;
    };

    // Show the overlay
    turnOffSearchingOverlay();
    turnOnSongsSearchOverlay();
}


// Function to handle selection of a search result
function selectSongResult(songIndex, songs) {

    console.log('Selected result:', songIndex);
    songName = songs[songIndex][0];
    songURI = songs[songIndex][1];
    songArtistName = songs[songIndex][4];
    artistURI = songs[songIndex][5];
    // Close the overlay after selection
    turnOffSongsSearchOverlay();
    turnOffArtistSection();
    turnOffArtistAlbums();
    turnOnSearchingOverlay();
    searchBySongURI(songName, songArtistName, songURI, artistURI);
}


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
            console.log('Add to Playlist: Index='+ playlistIndex + " " + playlistDict[playlistIndex]);   
            buildPlaylist(playlistDict);
        });
    
};


function closeArtistSearchOverlay() {
    turnOffArtistSearchOverlay();
    turnOffSearchingOverlay();
};


function closeSongsSearchOverlay() {
    turnOffSongsSearchOverlay();
    turnOffSearchingOverlay();
};


// Function to turn ON hidden artistAlbums
function turnOnArtistAlbums() {
    const artistAlbums = document.getElementById("artistAlbums");
    artistAlbums.style.display = "block";
    // console.log('turn On Artist Albums');
};


// Function to turn OFF hidden artistSection
function turnOffArtistAlbums() {
    const artistAlbums = document.getElementById("artistAlbums");
    artistAlbums.style.display = "none";
    // console.log('turn Off Artist Albums');
};


// Function to turn ON hidden artistSection
function turnOnArtistSection() {
    const artistSection = document.getElementById("artist");
    artistSection.style.display = "block";
    // console.log('turn On Artist Section');
};


// Function to turn OFF hidden artistSection
function turnOffArtistSection() {
    const artistSection = document.getElementById("artist");
    artistSection.style.display = "none";
    // console.log('turn Off Artist Section');
};


// Function to turn OFF searchingOverlay
function turnOnSearchingOverlay() {
    const searchingOverlay = document.getElementById("searchingOverlay");
    searchingOverlay.style.display = "flex";
    // console.log('turn On Searching Overlay');
};


// Function to turn OFF searchingOverlay
function turnOffSearchingOverlay() {
    const searchingOverlay = document.getElementById("searchingOverlay");
    searchingOverlay.style.display = "none";
    // console.log('turn Off Searching Overlay');
};


// Function to turn ON SongsSearchOverlay
function turnOnSongsSearchOverlay() {
    const songsSearchOverlay = document.getElementById('songsSearchOverlay');
    songsSearchOverlay.style.display = 'flex';
    // console.log('turn On Songs Search Overlay');
};


// Function to turn OFF SongsSearchOverlay
function turnOffSongsSearchOverlay() {
    const songsSearchOverlay = document.getElementById('songsSearchOverlay');
    songsSearchOverlay.style.display = 'none';
    // console.log('turn Off Songs Search Overlay');
};


// Function to turn ON artistSearchOverlay
function turnOnArtistSearchOverlay() {
    const artistSearchOverlay = document.getElementById('artistSearchOverlay');
    artistSearchOverlay.style.display = 'flex';
    // console.log('turn On Artist Search Overlay');
};


// Function to turn OFF artistSearchOverlay
function turnOffArtistSearchOverlay() {
    const artistSearchOverlay = document.getElementById('artistSearchOverlay');
    artistSearchOverlay.style.display = 'none';
    // console.log('turn Off Artist Search Overlay');
};


function buildPlaylist(playlistDict) {
    // Get the div with the class 'playlist'
    const playlistSection = document.getElementById('playlist');
    
    // Clear any existing content in the playlist div
    playlistSection.innerHTML = '';

    // Loop through the received object (assuming it's an object where the key is 'id' and the value is an array of tracks)
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
    
    console.log(Object.entries(playlistDict))
    
    //for (const id in playlistDict) {
    //    console.dir('PlaylistDict: Index= ' + id + ' ' + playlistDict[id]);
    //};
}

function clearPL() {
    playlistDict = {};
    buildPlaylist(playlistDict);
};

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


function setNewKeyForValue(obj, oldValue, newKey) {
    for (let [key, value] of Object.entries(obj)) {
      if (value === oldValue) {
        obj[newKey] = oldValue;  // Set the new key
        delete obj[key];         // Remove the old key
        break;                   // Exit once the value is found
      }
    }
  }


function createPlaylist() {
    let playlist = {};
    let uris = [];
    
    if (playlistDict == {}) {
        alert('You have no items in your playlist');
        return;
    }
    
    let playlistName = document.getElementById('playlistName').value;
    if (playlistName === '') {
        alert('You must enter a name for your Playlist');
        return;
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
    console.log(playlist);
    
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
            console.log('Playlist info received:', data);
            alert('Playlist successfully created!');
            clearPL();
        })
        .catch((error) => {
            console.error('Error adding playlist:', error);
    });
};

