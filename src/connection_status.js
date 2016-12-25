const CONNECTION_CHECK_PATH = 'check';

export default function initConnectionStatus(global) {
  function checkServerConnection(url) {
    return global.fetch(url, { method: 'HEAD' });
  }

  function isOnline(url) {
    // If we have no URL we are offline
    if (!url) {
      return Promise.resolve(false);
    }
    const serverUrl = url[url.length - 1] === '/'
        ? `${url}${CONNECTION_CHECK_PATH}`
        : `${url}/${CONNECTION_CHECK_PATH}`;

    if (global.navigator.onLine) {
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

  function onlineStatusChanged(url, cb) {
    global.addEventListener('online', () => {
      isOnline(url)
          .then((status) => {
            cb(status);
          });
    });

    global.addEventListener('offline', () => {
      cb(false);
    });

    // Set initial status
    isOnline(url)
        .then((status) => {
          cb(status);
        });
  }

  return { isOnline, onlineStatusChanged };
}
