const clientId = '311cd09e993f41f7b56314c6c9d9a828';
const redirectUri = 'https://jammming-smoky.vercel.app';
const scopes = 'playlist-modify-public';

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
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
    window.location = authUrl;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('code_verifier');
    accessToken = null;
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

    if (!code) {
      return null;
    } else {
      const codeVerifier = localStorage.getItem('code_verifier');
      console.log('Retrieved code_verifier:', codeVerifier);
      console.log('PKCE: code from URL:', code);
      const body = new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });
      console.log('PKCE: Token exchange body:', body.toString());
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      const data = await response.json();
      if (data.access_token) {
        accessToken = data.access_token;
        localStorage.setItem('access_token', accessToken);
        window.history.replaceState({}, document.title, '/');
        return accessToken;
      } else {
        console.error('Failed to obtain access token:', data);
        return null;
      }
    }
  },

  async search(term) {
    const token = await Spotify.getAccessToken();
    if (!token) return [];
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
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