import React from 'react';
import Playlist from './Playlist';

function SelectedPlaylistPanel({ playlist, className }) {
    if(!playlist) return null;

    return (
        <div className={className}>
            <h2>{playlist.name}</h2>
            {playlist.tracks?.items?.length > 0 ? (
                <ul>
                    {playlist.tracks.items.map((item, index) => (
                        <li key={index}>
                            {item.track.name} - {item.track.artists[0].name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>no tracks</p>
            )}
        </div>
    );
}

export default SelectedPlaylistPanel;

