#!/bin/sh
# Generate runtime env config for the React app
cat <<EOF > /usr/share/nginx/html/env.js
window.__ENV__ = {
  REACT_APP_BASE_URL: "${REACT_APP_BASE_URL:-https://magesh.com}"
};
EOF
