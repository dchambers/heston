import fetch from 'node-fetch';
import urlencode from 'urlencode';
import companyData from '../companyData';

const API_KEY = companyData.googleApiKey;
const SEARCH_ENGINE = companyData.googleSearchKey;

export default function getTripAdvisorPage(restaurant) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${urlencode(restaurant)}&cx=${SEARCH_ENGINE}&key=${API_KEY}`;
  return fetch(url).then(res => res.json()).then(json => json.items[0].link);
}
