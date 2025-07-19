import React from 'react';

function LoginButton({ onLogin }) {
  return (
    <button onClick={onLogin} style={{ margin: '20px', padding: '10px 20px', fontSize: '16px' }}>
      Login with Spotify
    </button>
  );
}

export default LoginButton; 