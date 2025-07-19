import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import Playlist from './components/Playlist';
import Spotify from './components/utilities/Spotify';
import LoginButton from './components/LoginButton';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkToken() {
      const token = await Spotify.getAccessToken();
      if (token) setIsLoggedIn(true);
    }
    checkToken();
  }, []);

  const handleLogin = async () => {
    await Spotify.startLogin();
  };

  const addTrack = (track) => {
    if (playlistTracks.find(savedTrack => savedTrack.id === track.id)) return;
    setPlaylistTracks(prev => [...prev, track]);
  };

  const removeTrack = (track) => {
    setPlaylistTracks(prev => prev.filter(t => t.id !== track.id));
  };

  const savePlaylist = async (playlistName) => {
    const trackURIs = playlistTracks.map(track => track.uri);
    await Spotify.savePlaylist(playlistName, trackURIs);
    setPlaylistTracks([]);
  };

  const searchSpotify = async (term) => {
    console.log('Searching Spotify for:', term);
    const results = await Spotify.search(term);
    console.log(results);
    setSearchResults(results);
  }; 

  return (
    <div>
      <h1> Welcome to Jammming </h1>
      {!isLoggedIn ? (
        <LoginButton onLogin={handleLogin} />
      ) : (
        <>
          <SearchBar onSearch={searchSpotify}/>
          <div className="App-playlist">
            <SearchResults searchResults={searchResults} onAdd={addTrack} />
            <Playlist 
              playlistTracks={playlistTracks} 
              onRemove={removeTrack} 
              onSave={savePlaylist}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default App;