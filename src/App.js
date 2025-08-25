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
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [toast, setToast] = useState(null);
  const [playlists, setPlaylists] = useState([]);

  function handleRemoveTrack(trackToRemove) {
    const updatedTracks = selectedPlaylist.tracks.filter(
      track => track.id !== trackToRemove.id
    );

    setSelectedPlaylist(prev => ({
      ...prev,
      tracks: updatedTracks
    }));
  }


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

  const savePlaylist = async (userPlaylists) => {
    const trackURIs = playlistTracks.map(track => track.uri);
    await Spotify.savePlaylist(userPlaylists, trackURIs);
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


  const handleSelectedPlaylist = async (playlist) => {

    const token = await Spotify.getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
      {
      headers: { Authorization: `Bearer ${token}` },
      }
    );

    const jsonResponse = await response.json();
    const playlistWithTracks = {
      ...playlist,
      tracks: jsonResponse.items.map(item => ({
        id: item.track.id,
        name: item.track.name,
        uri: item.track.uri,
        artist: item.track.artist?.[0]?.name || 'Unknown'
      }))
    };
    setSelectedPlaylist(playlistWithTracks)
  }


  const handleAddToSelectedPlaylist = async (track) => {
    if (!selectedPlaylist) return;
    await Spotify.addTracksToPlaylist(selectedPlaylist.id, [track.uri])

    setSelectedPlaylist(prev => 
      prev ? { ...prev, tracks: [...(prev.tracks || []), track] } : prev
    );
  }

  const handleRemoveFromSelectedPlaylist = async (track) => {
    if (!selectedPlaylist) return;
    await Spotify.removeTracksFromPlaylist(selectedPlaylist.id, [track.uri]);

    setSelectedPlaylist(prev => ({
      ...prev,
      tracks: prev.tracks.filter(t => t.id !== track.id)
    }));
  }

  const handleDeletePlaylist = async (playlistId) => {
    try {
      const token = await Spotify.getAccessToken();
      await Spotify.unfollowPlaylist(playlistId, token);
      setUserPlaylists(prev => prev.filter(p => p.id !== playlistId));
      setSelectedPlaylist(prev => (prev?.id === playlistId ? null : prev));
  

    } catch (err) {
      console.error(err);
      setToast("Could not find the playlist")
    }
  }



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
            <SearchResults searchResults={searchResults} onAdd={addTrack} onAddToSelected={handleAddToSelectedPlaylist} hasSelected={Boolean(selectedPlaylist?.id)}/>
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
              
                onSelect={handleSelectedPlaylist}
                />
              </div>

              {selectedPlaylist && (
      
                <div className='selected-panel'>
                  <SelectedPlaylistPanel playlist={selectedPlaylist} playlistTracks={playlistTracks} onRemoveFromSelected={handleRemoveFromSelectedPlaylist} onDeletePlaylist={handleDeletePlaylist} />
                  {toast && <div className="toast">{toast}</div>}
                </div>
              )}

          </div>
        </>
      )}
    </div>
  );
};

export default App;