import fetch from 'node-fetch';
import companyData from '../companyData';

const API_KEY = companyData.googleApiKey;
const SEARCH_ENGINE = companyData.googleSearchKey;
const enc = encodeURIComponent;

const log = message => {
  console.log('~' + message); // eslint-disable-line no-console
};

export const getPlaceInfo = (place) => {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${enc(place)}&key=${API_KEY}`;
  log(url + ' (getPlaceInfo)');
  return fetch(url).then(r => r.json()).then(json => json.results[0]).then(placeInfo => {
    return new Promise((resolve/*, reject*/) => {
      getTripAdvisorPage(placeInfo.name).then(tripAdvisorLink => {
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
  const url = `https://www.googleapis.com/customsearch/v1?q=${enc(restaurant)}&cx=${SEARCH_ENGINE}&key=${API_KEY}`;
  log(url + ' (getTripAdvisorPage)');
  return fetch(url).then(r => r.json()).then(json => json.items[0].link);
};
