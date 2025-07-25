import React from 'react';

function PlaylistSelector({ playlists, onSelect }) {
    if (!playlists || playlists.length === 0) return null;

    return (
        <div className="playlist-selector" >
            <h2>Your Playlists</h2>
            <ul>
                {playlists.map((playlist, index) => {
                    return (
                        <li
                      key={playlist.id}
                      onClick={() => onSelect(playlist)}
                      style={{
                        cursor: "pointer",
                        padding: '5px',
                        borderBottom: '1px solid #333',
                      }}
                    >
                        {playlist.name || <i>(Unnamed Playlist)</i>}
                    </li>
                    );
                })}
            </ul>
        </div>
    );
    console.log("Rendering PlaylistSelector with:", playlists);
};

export default PlaylistSelector;