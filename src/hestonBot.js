/* eslint "no-implicit-side-effects/no-implicit-side-effects": "error" */
import {assoc, assocPath, dissoc} from 'ramda';
import {sentenceParser, FOOT} from './sentenceParser';
import {getTravelDuration} from './utils';
import companyData from '../companyData';

const AWAITING_RESTAURANT_CONFIRMATION = 1;
const AWAITING_RATING = 2;
const AWAITING_REVIEW = 3;

const action = (state, messages) => ({state, messages});
const userMessage = (user, message) => ({type:'USER', user, message});

const removeStateProp = dissoc('state');

const createReviewFilter = (filter) => (restaurant) => {
	const travelDuration = getTravelDuration(filter.near, restaurant.location, (filter.by == FOOT) ? 'walking' : 'driving');
	const priceMatch = true; // TODO: we need to add pricing information to the restaurant data blob
	return (travelDuration < (filter.by == FOOT) ? 10 : 30) && priceMatch;
};

const hestonBot = (state = {users: {}, reviews: []}, message, data) => {
	if(message.match(/^heston review /)) {
		const restaurant = message.replace(/^heston review /, '');
		const userState = {state: AWAITING_RESTAURANT_CONFIRMATION, restaurant};
		const updatedState = assocPath(['users', data.user.id], userState, state);

		return action(updatedState, [
			userMessage(data.user.name, data.getPlaceInfo(restaurant).then(placeInfo => {
				void (updatedState.users[data.user.id].placeInfo = placeInfo);
				return placeInfo.tripAdvisorLink;
			})),
			userMessage(data.user.name, 'Is this the restaurant you want to review?')
		]);
	}
	else {
		const parsedSentence = sentenceParser(message);

		if(parsedSentence) {
			const reviewFilter = createReviewFilter(parsedSentence);
			const qualifyingRestaurants = state.reviews.filter(reviewFilter);

			return action(state, [
				userMessage(data.user.name, `I have ${qualifyingRestaurants.length} recommendations for restaurants near ${reviewFilter.near} from other ${companyData.companyName} staff if you're interested?\nType 'ok @heston' to see them.`)
			]);
		}
	}

	const userState = state.users[data.user.id] || {};
	switch(userState.state) {
		case AWAITING_RESTAURANT_CONFIRMATION: {
			if(message.match(/yes/)) {
				const updatedState = assocPath(['users', data.user.id], {...userState, state: AWAITING_RATING}, state);
				return action(updatedState, [
					userMessage(data.user.name, 'What\'s your rating from 0 to 5?')
				]);
			}
			else {
				const updatedState = assocPath(['users', data.user.id], {}, state);
				return action(updatedState, [
					userMessage(data.user.name, 'Okay, please try entering the name differently.')
				]);
			}
		}

		case AWAITING_RATING: {
			if(message.match(/[0-5]/)) {
				const updatedState = assocPath(['users', data.user.id], {...userState, rating: Number(message), state: AWAITING_REVIEW}, state);
				return action(updatedState, [
					userMessage(data.user.name, 'Thanks! Can you please provide some textual content to justify that rating.')
				]);
			}
			else {
				const updatedState = assocPath(['users', data.user.id], {}, state);
				return action(updatedState, [
					userMessage(data.user.name, 'Fine, consider this conversation over!!')
				]);
			}
		}

		case AWAITING_REVIEW: {
			const restaurantReview = removeStateProp({...userState, user: data.user.name, description: message});
			const updatedState = assocPath(['users', data.user.id], {}, state);
			const updatedState2 = assoc('reviews', [...updatedState.reviews, restaurantReview], updatedState);

			return action(updatedState2, [
				userMessage(data.user.name, 'Your review has been noted my friend!')
			]);
		}

		default: {
			return action(state, []);
		}
	}
};

export default hestonBot;
