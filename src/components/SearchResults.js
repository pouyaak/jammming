
import React from 'react';

function SearchResults({ searchResults, onAdd, onAddToSelected, hasSelected }) {
  return (
    <div className="SearchResults">
      <h2>Results</h2>

      {searchResults.length === 0 ? (
        <p>No results yet.</p>
      ) : (
        searchResults.map(track => (
          <div key={track.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <strong>{track.name}</strong> — {track.artist} | {track.album}
            </div>

            <button onClick={() => onAdd(track)}>
              Add To New Playlist
            </button>

            <button
              onClick={() => onAddToSelected(track)}
              disabled={!hasSelected}
              title={hasSelected ? '' : 'Pick a playlist first'}
            >
              Add To Selected
            </button>
            <img src={track.cover} style={{ width: '60px'}}/>
            
          </div>
        ))
      )}
    </div>
  );
}

export default SearchResults;