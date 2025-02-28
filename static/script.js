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
    let inputValue = document.getElementById('artistName').value;

    // Send inputValue to Flask via a POST request using Fetch API
    fetch('/searchArtist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: inputValue }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success. Found data for ', data.artistName);

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
                                            console.log(playlistDict); 
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

                                // Append the "Add" and "Play" buttons after the track name
                                trackListItem.appendChild(playButton);
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
        
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function buildPlaylist(data) {
    // Get the div with the class 'playlist'
    const playlistSection = document.getElementById('playlist');
    
    // Clear any existing content in the playlist div
    playlistSection.innerHTML = '';

    // Loop through the received object (assuming it's an object where the key is 'id' and the value is an array of tracks)
    for (const id in data) {
        if (data.hasOwnProperty(id)) {
            // Create a new div to hold the track names for this id
            const trackDiv = document.createElement('div');
            trackDiv.classList.add('plTracks'); 

            // Get the array of tracks for this id
            const tracks = data[id];
            
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
                // You can perform actions to delete the track here
                trackDiv.remove();
                deleteFromPlaylist(tracks[1])
                console.log(playlistDict);
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
                // If the trackName matches, delete this array using splice
                // Since splice modifies the array in place, we remove the element at the current index
                playlistDict[key].splice(0, 2);  // Removes the trackID and trackName from the array
    
                // Optionally, delete the key from the dictionary if you don't want the key-value pair
                delete playlistDict[key];
    
                break;  // Exit the loop after deleting the track
            }
        }
    }
    console.log(playlistDict);
    buildPlaylist(playlistDict);
};

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

