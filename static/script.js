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
                '</b';
        });
}, 5000); // Every 5000 milliseconds (5 seconds)

function sendArtist() {
    var inputValue = document.getElementById('artistName').value;

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
            document.getElementById('artistDetails').innerHTML = '';
            document.getElementById('artistAlbums').innerHTML = '';

            document.getElementById('artistDetails').innerHTML = `
            <div class="artist-section">
                <div class="artist-image">
                    <img src="${data.artistArt}" alt="Image of ${data.artistName}" style="width: 300px; height: 300px;">
                </div>
                <div class="artist-info">
                    <p><strong>Artist Name:</strong> ${data.artistName}</p>
                    <p><strong>Followers:</strong> ${data.artistFollowers}</p>
                    <p><strong>Genre:</strong> ${data.artistGenre}</p>
                </div>
                <div id="playlist">
                </div>
            </div>
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
                                const trackListItem =
                                    document.createElement('li');
                                trackListItem.textContent = `${trackNumber}. ${track.trackName}`; // Numbered track name
                                
                                // Create the "Add" button for each track
                                const addButton = document.createElement('button');
                                addButton.textContent = 'Add'; // Button text
                                addButton.classList.add('plAddButton'); // Add a class for styling if necessary
                                
                                // Store the track ID in the button's data attribute
                                addButton.setAttribute('plTrackID', track.trackID);
                                
                                // Add event listener for when the button is clicked
                                addButton.addEventListener('click', function() {
                                    // When clicked, send the track ID to Flask
                                    const trackID = addButton.getAttribute('plTrackID');
                                    console.log('Track ID to add:', trackID);
                                    
                                    // Send trackID to Flask via a POST request using Fetch API
                                    fetch('/addTrack', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ trackID: trackID }),  // Send trackID as JSON
                                    })
                                        .then((response) => response.json())
                                        .then((data) => {
                                            console.log('Track added:', data);
                                            // Optionally update the UI based on the response, e.g., display success message
                                            buildPlaylist(data.playlistDict);
                                        })
                                        .catch((error) => {
                                            console.error('Error adding track:', error);
                                    });
                                });

                                // Append the "Add" button after the track name
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
            trackDiv.classList.add('plTracks'); // Optional: Add a class for styling

            // Get the array of tracks for this id
            const tracks = data[id];
            
            const trackContainer = document.createElement('div');
            trackContainer.classList.add('track-container'); // Add a class for styling the flex container

            const trackNameElement = document.createElement('p');
            trackNameElement.textContent = tracks[1]; // Assuming tracks[1] holds the track name

            // Create a delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-btn'); // Optional: Add a class for styling

            // Add an event listener to the delete button
            deleteButton.addEventListener('click', () => {
                // You can perform actions to delete the track here
                trackDiv.remove();
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





