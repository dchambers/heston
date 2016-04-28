import fetch from 'node-fetch';
import urlencode from 'urlencode';
import companyData from '../companyData';

const API_KEY = companyData.googleApiKey;
const SEARCH_ENGINE = companyData.googleSearchKey;

export const getPlaceInfo = (place) => {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${place}&key=${API_KEY}`;
  return fetch(url).then(r => r.json()).then(json => json.results[0]).then(placeInfo => {
    return new Promise((resolve/*, reject*/) => {
      getTripAdvisorPage(placeInfo.name).then(tripAdvisorLink => {
        resolve({...placeInfo, tripAdvisorLink});
      });
    });
  });
};

export const getTravelDuration = (from, to, mode) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?mode=${mode}&origins=${from}&destinations=${to}`;
  return fetch(url).then(r => r.json()).then(json => json.rows[0].elements[0].duration.value / 60);
};

export const getTripAdvisorPage = (restaurant) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${urlencode(restaurant)}&cx=${SEARCH_ENGINE}&key=${API_KEY}`;
  return fetch(url).then(r => r.json()).then(json => json.items[0].link);
};
