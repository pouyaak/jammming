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
            {/* {playlist.tracks?.items?.length > 0 ? (
                <ul>
                    {playlist.tracks.items.map((item, index) => (
                        <li key={index}>
                            {item.track.name} - {item.track.artists[0].name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p></p>
            )} */}

            {playlist.tracks.map(track => (
                <div>
                    <p>{track.name}</p>
                    <button onClick={() => onRemoveFromSelected(track)}>Remove</button>
                </div>
            ))}


            {/* <TrackList
                tracks={playlist.tracks?.items || []}
            /> */}

        </div>
    );
}

export default SelectedPlaylistPanel;

