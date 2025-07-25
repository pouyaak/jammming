import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import Playlist from './components/Playlist';
import Spotify from './components/utilities/Spotify';
import LoginButton from './components/LoginButton';
import PlaylistSelector from './components/PlaylistSelector';
import SelectedPlaylistPanel from './components/SelectedPlaylistPanel';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)

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
      
        setIsLoggedIn(false);
      }
    }
    checkToken();
  }, []);

  useEffect(() => {
    if(isLoggedIn) {
      Spotify.getUserPlaylists().then(playlists => {
        console.log('Fetched playlists:', playlists);
        setUserPlaylists(playlists);
      });
    }
  }, [isLoggedIn]);

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
    setMessage('🎉 Playlist saved to your Spotify!');
    setTimeout(() => setMessage(''), 3000)
    setPlaylistTracks([]);
  };

  const searchSpotify = async (term) => {
    console.log('Searching Spotify for:', term);
    const results = await Spotify.search(term);
    console.log(results);
    setSearchResults(results);
  }; 


  const handleSelectPlaylist = async (playlist) => {
    const token = await Spotify.getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const jsonResponse = await response.json();

    const playlistWithTracks = { ...playlist, tracks: jsonResponse };
    setSelectedPlaylist(playlistWithTracks);
  };


  console.log("Rendering App - isLoggedIn:", isLoggedIn, "userPlaylists.length:", userPlaylists.length);

  return (
    <div>
      <h1 id="banner"> Wellcome to Jammming</h1>
      {!isLoggedIn ? (
        <div>
          <LoginButton onLogin={handleLogin} />
        </div>
      ) : (
        <>
          <button 
            onClick={handleLogout} 
            style={{ 
              position: 'fixed', 
              bottom: '10px', 
              right: '10px', 
              padding: '5px 10px',
              fontSize: '12px',
              margin: "10px",
              cursor: "pointer",
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
              message={message}
              setMessage={setMessage}
            />
          </div>

          <div className='playlist-section'>

              <div className='your-playlists'>
                <PlaylistSelector 
                playlists={userPlaylists}
                onSelect={handleSelectPlaylist}
                />
              </div>

              {selectedPlaylist && (
                <div className='selected-panel'>
                  <SelectedPlaylistPanel playlist={selectedPlaylist} playlistTracks={playlistTracks} />
                </div>
              )}

          </div>
        </>
      )}
    </div>
  );
};

export default App;