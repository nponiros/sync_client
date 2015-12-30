function exec(options) {
  const promise = new Promise((resolve, reject) => {
    const method = 'POST';
    const {data, url} = options;

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = 'json';

    xhr.setRequestHeader('X-Request-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    function handleResponse() {
      if (xhr.status !== 200) {
        reject(Error(xhr.statusText));
      }
      resolve(xhr.response);
    }

    function handleError() {
      if (xhr.status === 0) {
        reject(Error('Server connection failed'));
      } else {
        reject(Error('Some error occurred'));
      }
    }

    function handleAbort() {
      reject(Error('Connection aborted'));
    }

    xhr.onload = handleResponse;
    xhr.onerror = handleError;
    xhr.onabort = handleAbort;

    xhr.send(JSON.stringify(data));
  });

  return promise;
}

export function post(url, data) {
  return exec({url, data});
}
