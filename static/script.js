function sendArtist() {
    var inputValue = document.getElementById("artistName").value;

    // Send inputValue to Flask via a POST request using Fetch API
    fetch('/searchArtist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: inputValue })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        document.getElementById('artistDetails').innerHTML = `
                    <p><strong>Artist Name:</strong> ${data.artistName}</p>
                    <p><strong>Followers:</strong> ${data.artistFollowers}</p>
                    <p><strong>Genre:</strong> ${data.artistGenre}</p>
                    <p><img src="${data.artistArt}" alt="Image of ${data.artistName}"></p>
                `;
        const displayElement = document.getElementById('artistAlbums');

        // Loop through albumsDict
        for (const albumKey in data.albumsDict) {
            if (data.albumsDict.hasOwnProperty(albumKey)) {
                // Create a section for each album
                const albumsDiv = document.createElement('div');
                albumsDiv.innerHTML = `<h3>${albumKey}</h3>`;  // Display albumKey as a heading
        
                // Access the album dictionary using albumKey
                const albumData = data.albumsDict[albumKey];
        
                // Check if the albumData contains both 'albumName' and 'albumArt'
                if (albumData.albumName && albumData.albumArt) {
                    // Display the album name as text
                    const albumNameElement = document.createElement('p');
                    albumNameElement.textContent = albumData.albumName;
                    albumsDiv.appendChild(albumNameElement);
        
                    // Create an <img> tag to display the album art
                    const albumArtElement = document.createElement('img');
                    albumArtElement.src = albumData.albumArt;  // Set the src to the albumArt URL
                    albumArtElement.alt = `Album art for ${albumData.albumName}`;  // Alt text for accessibility
                    albumArtElement.style.maxWidth = "300px";  // Optional: limit the size of the image
                    albumArtElement.style.maxHeight = "300px"; // Optional: limit the size of the image
        
                    // Append the image to the album section
                    albumsDiv.appendChild(albumArtElement);
                }
        
                // Append the album section to the main display element
                displayElement.appendChild(albumsDiv);
            }
        }
                
                
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
