const CONNECTION_CHECK_PATH = 'check';

function checkServerConnection(url) {
  return window.fetch(url, { method: 'HEAD' });
}

export function isOnline(url) {
  // If we have no URL we are offline
  if (!url) {
    return Promise.resolve(false);
  }
  const serverUrl = url[url.length - 1] === '/'
      ? `${url}${CONNECTION_CHECK_PATH}`
      : `${url}/${CONNECTION_CHECK_PATH}`;

  if (window.navigator.onLine) {
    return checkServerConnection(serverUrl)
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
  return Promise.resolve(false);
}

export function onlineStatusChanged(url, cb) {
  window.addEventListener('online', () => {
    isOnline(url)
      .then((status) => {
        cb(status);
      });
  });

  window.addEventListener('offline', () => {
    cb(false);
  });

  // Set initial status
  isOnline(url)
    .then((status) => {
      cb(status);
    });
}
