import React,{useState} from 'react';

function Track({ track, onAdd, onRemove, isRemoval }) {
    const [isPopping, setIsPopping] = useState(false)
    const addTrack = () => {
        onAdd(track);
        setIsPopping(true);
        setTimeout(() => setIsPopping(false), 50); // duration must match CSS animation
    };

    const removeTrack = () => {
        onAdd(track);
    };

    // const handleClick = () => {
    //     if (isRemoval && onRemove) {
    //         onRemove(track);
    //     } else if (onAdd) {
    //         onAdd(track);
    //         setIsPopping(true)
    //         setTimeout(() => setIsPopping(false), 500);
    //     }
    // }

    return (
        <div className="Track">
            <div className="Track-information">
                <h3>{track.name}</h3>
                <p>{track.artist} | {track.album}</p>
            </div>
            <button 
                // className="Track-action"
                className={`Track-action ${isPopping ? 'pop' : ''}`}
                onClick={isRemoval ? removeTrack : addTrack}>
                {isRemoval ? '-' : '+'}
            </button>
            {/* <button onClick={handleClick}>
                {isRemoval ? '-' : '+'}
            </button> */}
        </div>
    );
}

export default Track;