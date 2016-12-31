import fetch from 'isomorphic-fetch';

export default function serverComm(url, data, options) {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  const opts = {
    headers,
    method: 'POST',
    body: JSON.stringify(data),
    mode: 'cors',
    credentials: options.credentials,
  };
  return fetch(url, opts)
    .then((response) => {
      if (response.ok) { // status 200-299
        return response.json();
      }
      return {
        success: false,
        errorMessage: 'Some server error occurred',
      };
    }, (error) => { // Network failure
      return Promise.reject(error);
    });
}
