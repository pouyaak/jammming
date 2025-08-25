
import React, { useState } from 'react';

function Track({ track, onAdd, onRemove, isRemoval }) {
  const [isPopping, setIsPopping] = useState(false);

  const addTrack = () => {
    onAdd?.(track);
    setIsPopping(true);
    setTimeout(() => setIsPopping(false), 50);
  };

  const removeTrack = () => {
    onRemove && onRemove(track); // ✅ call onRemove, not onAdd
  };

  return (
    <div className="Track" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* cover */}
      {track.cover ? (
        <img
          src={track.cover}
          alt={`${track.name} cover`}
          style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover' }}
          loading="lazy"
        />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: 6, background: '#222' }} />
      )}

      {/* text */}
      <div className="Track-information" style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 16, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {track.name}
        </h3>
        <p style={{ margin: 0, color: '#b3b3b3' }}>
          {track.artist} | {track.album}
        </p>
      </div>

      {/* preview (30s) */}
      {/* {track.preview ? (
        <audio controls >
          <source src={track.preview} type="audio/mpeg" />
        </audio>
      ) : (
        <span style={{ fontSize: 12, color: '#777' }} title="No preview available">no preview</span>
      )} */}

      {/* action */}
      <button
        className={`Track-action ${isPopping ? 'pop' : ''}`}
        onClick={isRemoval ? removeTrack : addTrack}
      >
        {isRemoval ? '-' : '+'}
      </button>
    </div>
  );
}

export default Track;