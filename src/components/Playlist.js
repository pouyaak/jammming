import React, { useState } from 'react';
import TrackList from './TrackList';

function Playlist({ playlistTracks, onRemove, onSave }) {
    const [playlistName, setPlaylistName] = useState('New Playlist');

    const handleNameChange = (e) => {
        setPlaylistName(e.target.value);
    };

    const handleSave = () => {
        onSave(playlistName);
    };

    return (
        <div className="Playlist">
            <input 
                value={playlistName} 
                onChange={handleNameChange}
                placeholder="Enter Playlist Name"
            />
            <TrackList 
                tracks={playlistTracks} 
                onAdd={onRemove} 
                isRemoval={true} 
            />
            <button className="Playlist-save" onClick={handleSave}>
                SAVE TO SPOTIFY
            </button>
        </div>
    );
}

export default Playlist;