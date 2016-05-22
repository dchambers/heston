import fetch from 'node-fetch';
import config from '../config';

const enc = encodeURIComponent;

const log = message => {
  console.log('~' + message); // eslint-disable-line no-console
};

export const getPlaceInfo = (place) => {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${enc(place)}&key=${config.apiKey.google}`;
  log(url + ' (getPlaceInfo)');
  return fetch(url).then(r => r.json()).then(json => json.results[0]).then(placeInfo => {
    return new Promise((resolve/*, reject*/) => {
      getTripAdvisorPage(placeInfo.formatted_address).then(tripAdvisorLink => {
        resolve({...placeInfo, tripAdvisorLink});
      });
    });
  });
};

export const getTravelDuration = (from, to, mode) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?mode=${mode}&origins=${enc(from)}&destinations=${enc(to)}`;
  log(url + ' (getTravelDuration)');
  return fetch(url)
    .then(r => r.json())
    .then(json => json.rows[0].elements[0].duration)
    .then(duration => (!duration) ? Number.MAX_SAFE_INTEGER : duration.value / 60);
};

export const getTripAdvisorPage = (restaurant) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${enc(restaurant)}&cx=${config.apiKey.googleSearch}&key=${config.apiKey.google}`;
  log(url + ' (getTripAdvisorPage)');
  return fetch(url).then(r => r.json()).then(json => json.items[0].link);
};
