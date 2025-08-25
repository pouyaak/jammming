const clientId = '311cd09e993f41f7b56314c6c9d9a828';
// const redirectUri = 'https://jammming-phi.vercel.app'; 
const redirectUri = 'http://127.0.0.1:3000/';
const scopes = 'playlist-modify-public playlist-modify-private user-read-private user-read-email user-read-playback-state user-read-currently-playing';


function generateCodeVerifier(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let codeVerifier = '';
  for (let i = 0; i < length; i++) {
    codeVerifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return codeVerifier;
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

let accessToken;

const Spotify = {
  async startLogin() {
    const codeVerifier = generateCodeVerifier();
    localStorage.setItem('code_verifier', codeVerifier);
    console.log('Storing code_verifier:', codeVerifier);

    // Clear both localStorage and module-level cache
    localStorage.removeItem('access_token');
    accessToken = null;

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&code_challenge_method=S256&code_challenge=${codeChallenge}&show_dialog=true&force_approve=true`;
    

    console.log('Redirecting to Spotify auth URL:', authUrl);
    console.log('Redirect URI being used:', redirectUri);
    console.log('Client ID being used:', clientId);
    console.log('Scopes being requested:', scopes);
    
    window.location = authUrl;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('code_verifier');
    accessToken = null;
  },

  forceLogout() {
    // Clear everything and redirect to clear URL params
    localStorage.removeItem('access_token');
    localStorage.removeItem('code_verifier');
    accessToken = null;
    
    // Clear any sessionStorage that might contain Spotify data
    sessionStorage.clear();
    
    // Clear cookies for Spotify domains
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log('Cleared all Spotify-related data');
    window.location.href = window.location.origin;
  },

  async checkTokenValidity() {
    const token = await Spotify.getAccessToken();
    if (!token) return false;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Token is valid for user:', userData.display_name);
        return true;
      } else {
        console.error('Token validation failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  },

  isInAuthFlow() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') || urlParams.has('error');
  },

  checkRedirectUri() {
    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);
    console.log('Expected redirect URI:', redirectUri);
    console.log('URLs match:', currentUrl.startsWith(redirectUri));
    
    // Check if we're on localhost or the deployed URL
    const isLocalhost = currentUrl.includes('127.0.0.1') || currentUrl.includes('localhost');
    const isDeployed = currentUrl.includes('jammming-phi.vercel.app');
    
    console.log('Is localhost:', isLocalhost);
    console.log('Is deployed:', isDeployed);
    
    return currentUrl.startsWith(redirectUri);
  },

  getCurrentConfig() {
    return {
      clientId,
      redirectUri,
      scopes,
      currentUrl: window.location.href
    };
  },

  fixRedirectUri() {
    const currentUrl = window.location.href;
    const isLocalhost = currentUrl.includes('127.0.0.1') || currentUrl.includes('localhost');
    const isDeployed = currentUrl.includes('jammming-phi.vercel.app');
    
    // If we're on localhost but should be on deployed, or vice versa
    if (isLocalhost && redirectUri.includes('jammming-phi.vercel.app')) {
      console.log('Redirecting to deployed URL...');
      window.location.href = currentUrl.replace(/http:\/\/127\.0\.0\.1:3000/, 'https://jammming-phi.vercel.app');
      return true;
    } else if (isDeployed && redirectUri.includes('127.0.0.1')) {
      console.log('Redirecting to localhost...');
      window.location.href = currentUrl.replace(/https:\/\/jammming-phi\.vercel\.app/, 'http://127.0.0.1:3000');
      return true;
    }
    return false;
  },

  async getAccessToken() {
    // Always check localStorage first to ensure we get the most recent token
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
        accessToken = storedToken;
        return accessToken;
    }
    
    // If no stored token, check if we have a cached one
    if (accessToken) return accessToken;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    console.log('URL params:', { code: code ? 'present' : 'missing', error, state });

    if (error) {
      console.error('Spotify authorization error:', error);
      if (error === 'access_denied') {
        console.error('User denied access to the app');
      }
      return null;
    }

    if (!code) {
      console.log('No authorization code found in URL');
      console.log('This usually means:');
      console.log('1. The redirect URI is not configured in your Spotify app settings');
      console.log('2. You\'re using a different Client ID than what\'s configured');
      console.log('3. The user denied access');
      return null;
    } else {
      const codeVerifier = localStorage.getItem('code_verifier');
      console.log('Retrieved code_verifier:', codeVerifier);
      console.log('PKCE: code from URL:', code);
      
      if (!codeVerifier) {
        console.error('No code_verifier found in localStorage');
        return null;
      }
      
      const body = new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });
      console.log('PKCE: Token exchange body:', body.toString());
      
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        
        console.log('Token exchange response status:', response.status);
        
              const data = await response.json();
      console.log('Token exchange response:', data);
      
      if (data.access_token) {
        accessToken = data.access_token;
        localStorage.setItem('access_token', accessToken);
        window.history.replaceState({}, document.title, '/');
        console.log('Successfully obtained access token');
        console.log('Token scopes:', data.scope || 'No scopes returned');
        return accessToken;
      } else {
        console.error('Failed to obtain access token:', data);
        return null;
      }
      } catch (error) {
        console.error('Error during token exchange:', error);
        return null;
      }
    }
  },

  async getUserPlaylists() {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return [];

    const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50&_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${accessToken}`},
      cache: 'no-store',
    });
    

    const jsonResponse = await response.json();
    return jsonResponse.items || [];
  },

  async search(term) {
    const token = await Spotify.getAccessToken();
    if (!token) {
      console.error('No access token available');
      return [];
    }
    
    console.log('Searching with token:', token.substring(0, 20) + '...');
    
    // Skip token validation for now - go straight to search
    console.log('Proceeding with search without token validation...');
    
    try {
      // Try a simpler search first
      const searchUrl = `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}&limit=20`;
      console.log('Making request to:', searchUrl);
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      console.log('Search response status:', response.status);
      
      if (!response.ok) {
        console.error('Spotify API error:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('Search error details:', errorData);
        
        // Try a different approach - maybe the issue is with the search endpoint
        console.log('Trying alternative search approach...');
        const altResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(term)}&type=track`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        console.log('Alternative search response status:', altResponse.status);
        
        if (altResponse.ok) {
          const altJsonResponse = await altResponse.json();
          console.log('Alternative search response:', altJsonResponse);
          
          if (!altJsonResponse.tracks) return [];
          return altJsonResponse.tracks.items.map((track) => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri,
          }));
        } else {
          console.error('Alternative search also failed:', altResponse.status, altResponse.statusText);
        }
        
        if (response.status === 401 || response.status === 403) {
          console.log('Token might be expired, clearing cache...');
          localStorage.removeItem('access_token');
          accessToken = null;
        }
        return [];
      }
      
      const jsonResponse = await response.json();
      console.log('Search response:', jsonResponse);
      
      if (!jsonResponse.tracks) return [];
      return jsonResponse.tracks.items.map((track) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        uri: track.uri,
      }));
    } catch (error) {
      console.error('Network error during search:', error);
      return [];
    }
  },

  addTracksToPlaylist: async function(playlistId, uris) {
    const accessToken = await Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uris })
    });
  },

  removeTracksFromPlaylist: async function(playlistid, uris) {
    const accessToken = await Spotify.getAccessToken()
    const payload = {
      tracks: uris.map(uri => ({ uri }))
    };
  
    console.log("Attempting to remove tracks with payload:", payload);

    return fetch (`https://api.spotify.com/v1/playlists/${playlistid}/tracks`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      console.log('Response status:', response.status);
      return response.json().then(data => {
        console.log("spotify API delete response:", data);
      })
    })
    .catch(error => {
      console.error('Error deleting track:', error)
    })
  },

  unfollowPlaylist: async function(playlistId) {
    const accessToken = await Spotify.getAccessToken();
    const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/followers`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Unfollow failed: ${res.status} ${res.statusText} ${text}`)
    } 
    return true;
  },

  savePlaylist: async function (name, trackURIs) {
    const accessToken = await Spotify.getAccessToken();

    const createRes =  await fetch('https://api.spotify.com/v1/me/playlists', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name
      })
    });
    const created = await createRes.json();
    if(!createRes.ok) {
      throw new Error ('F')
    }

    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${created.id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': "application'json"
      },
      body: JSON.stringify({ uris: trackURIs})
    });
    return created;
  }
  
}

export default Spotify;