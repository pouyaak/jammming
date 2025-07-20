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
      // Check if we're on the correct domain
      Spotify.checkRedirectUri();
      
      // Check if we need to redirect to the correct URL
      if (Spotify.fixRedirectUri()) {
        return; // Will redirect, so don't continue
      }
      
      // If we're in the middle of an auth flow, wait for it to complete
      if (Spotify.isInAuthFlow()) {
        console.log('In authentication flow, waiting for completion...');
        const token = await Spotify.getAccessToken();
        if (token) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
        return;
      }
      
      const isValid = await Spotify.checkTokenValidity();
      if (isValid) {
        setIsLoggedIn(true);
      } else {
        // Clear invalid tokens
        Spotify.logout();
        setIsLoggedIn(false);
      }
    }
    checkToken();
  }, []);

  const handleLogin = async () => {
    await Spotify.startLogin();
  };

  const handleLogout = () => {
    Spotify.forceLogout();
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
      <h1> GI BEKHOR </h1>
      {!isLoggedIn ? (
        <div>
          <LoginButton onLogin={handleLogin} />
          <div style={{ margin: '20px', fontSize: '12px', color: '#666' }}>
            <strong>Current Configuration:</strong><br />
            Client ID: {Spotify.getCurrentConfig().clientId}<br />
            Redirect URI: {Spotify.getCurrentConfig().redirectUri}<br />
            Scopes: {Spotify.getCurrentConfig().scopes}
          </div>
          <div style={{ margin: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <strong>For other users:</strong><br />
            • They should use this same app (same Client ID)<br />
            • They log into their own Spotify account<br />
            • The redirect URI must be configured in the Spotify app settings
          </div>
        </div>
      ) : (
        <>
          <button 
            onClick={handleLogout} 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              padding: '5px 10px',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
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