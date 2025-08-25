import React from 'react';
import Playlist from './Playlist';
import TrackList from './TrackList'

function SelectedPlaylistPanel({ playlist, className, onRemoveFromSelected, onDeletePlaylist }) {
    if(!playlist) return null;

    return (
        <div className={className}>
            <h2>SelectedPlaylist:</h2>
            <h3>{playlist.name}</h3>
            <button onClick={() => onDeletePlaylist(playlist.id)}>
                Delete Playlist
            </button>

            {/* {playlist.tracks.map(track => (
                <div>
                    <p>{track.name}</p>
                    <button onClick={() => onRemoveFromSelected(track)}>Remove</button>
                </div>
            ))} */}
           <TrackList
              tracks={playlist.tracks}
              onRemove={onRemoveFromSelected}  // Track uses onRemove when isRemoval = true
              isRemoval={true}
            />




        </div>
    );
}

export default SelectedPlaylistPanel;

