const clientId = '311cd09e993f41f7b56314c6c9d9a828';
const redirectUri = 'https://jammming-phi.vercel.app';
const scopes = 'playlist-modify-public user-read-private user-read-email';

// PKCE helper functions
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

  async search(term) {
    const token = await Spotify.getAccessToken();
    if (!token) {
      console.error('No access token available');
      return [];
    }
    
    console.log('Searching with token:', token.substring(0, 20) + '...');
    
    // First, let's test the token with a simple API call
    try {
      const testResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!testResponse.ok) {
        console.error('Token test failed:', testResponse.status, testResponse.statusText);
        const errorData = await testResponse.json().catch(() => ({}));
        console.error('Error details:', errorData);
        
        if (testResponse.status === 401 || testResponse.status === 403) {
          console.log('Token is invalid, clearing cache...');
          localStorage.removeItem('access_token');
          accessToken = null;
          return [];
        }
      } else {
        const userData = await testResponse.json();
        console.log('Token is valid for user:', userData.display_name);
      }
    } catch (error) {
      console.error('Error testing token:', error);
    }
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      console.error('Spotify API error:', response.status, response.statusText);
      const errorData = await response.json().catch(() => ({}));
      console.error('Search error details:', errorData);
      
      if (response.status === 401 || response.status === 403) {
        console.log('Token might be expired, clearing cache...');
        localStorage.removeItem('access_token');
        accessToken = null;
      }
      return [];
    }
    
    const jsonResponse = await response.json();
    if (!jsonResponse.tracks) return [];
    return jsonResponse.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      uri: track.uri,
    }));
  },

  async savePlaylist(name, trackURIs) {
    if (!name || !trackURIs.length) return;
    const token = await Spotify.getAccessToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    let userId;
    const response = await fetch('https://api.spotify.com/v1/me', { headers });
    const jsonResponse = await response.json();
    userId = jsonResponse.id;
    const createPlaylistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({ name: name }),
      }
    );
    const createPlaylistJsonResponse = await createPlaylistResponse.json();
    const playlistId = createPlaylistJsonResponse.id;
    await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
      {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({ uris: trackURIs }),
      }
    );
  },
};

export default Spotify;