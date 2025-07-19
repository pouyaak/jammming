import React, { useState } from 'react';

function SearchBar({ onSearch }) {
    const [term, setTerm] = useState('');

    const handleTermChange = (e) => {
        setTerm(e.target.value);
    };
    const search = () => {
        console.log(`Seaching for: ${term}`)
        onSearch(term);
    };
    
    return (
        <div className='SearchBar'>
            <input type="text" placeholder="Enter a Song, Album, or Artist" value={term} onChange={handleTermChange} />
            <button onClick={search}>Search</button>
        </div>
    );
}

export default SearchBar;