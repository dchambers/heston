import {zipObj} from 'ramda';
import pluralize from 'pluralize';
import config from '../config'

export const DEFAULT_LOCATION = config.companyAddress;

export const FOOT = 'FOOT';
export const PUBLIC_TRANSPORT = 'PUBLIC_TRANSPORT';

export const LOW = 'LOW';
export const HIGH = 'HIGH';

export const findWordGroups = (sentence) => {
  return sentence.replace('to eat', 'to_eat').replace('get food', 'get_food');
};

export const sentenceParser = (sentence) => {
  const isQuestion = sentence.substr(sentence.length - 1, 1) == '?';

  if(isQuestion) {
    const sentenceWords = sentence.substr(0, sentence.length - 1);
    const wordList = findWordGroups(sentenceWords).split(/[ ]+/).map(pluralize.singular);
    const words = zipObj(wordList, wordList.map(() => true));
    const restaurantQuery = (words.restaurant || words.meal || words.to_eat);
    const lunchQuery = (words.lunch || words.lunchtime || words.get_food);

    if((restaurantQuery || lunchQuery) && (words.trying || words.good || words.nice || words.favourite ||
      words.best || words.recommend || words.recommendation)) {
      const locationMatches = sentence.match(/(in|near) (.*)\?/);
      const rawLocation = (locationMatches) ? locationMatches[2] : DEFAULT_LOCATION;
      const location = rawLocation.replace(/(here|town|the city|the office)/i, DEFAULT_LOCATION);
      const foodQuery = (restaurantQuery) ?
        {
          near: location,
          by: PUBLIC_TRANSPORT
        } :
        {
          near: location,
          by: FOOT,
          price: LOW
        };

      return (words.client || words.business) ? {...foodQuery, price: HIGH} : foodQuery;
    }
  }

  return null;
};
