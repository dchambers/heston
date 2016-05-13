/* eslint "no-implicit-side-effects/no-implicit-side-effects": "error" */
import {assoc, assocPath, dissoc, dissocPath} from 'ramda';
import filter from 'array-promise-filter';
import {sentenceParser, FOOT, LOW, HIGH} from './sentenceParser';
import companyData from '../companyData';

const AWAITING_RESTAURANT_CONFIRMATION = 1;
const AWAITING_RATING = 2;
const AWAITING_REVIEW = 3;

const action = (state, messages) => ({state, messages});
const userMessage = (user, message) => ({type:'USER', user, message});

const removeStateProp = dissoc('state');

const createReviewFilter = (filter, getTravelDuration) => (review) => {
	const loc = review.placeInfo.geometry.location;
	const locStr = loc.lat + ',' + loc.lng;
	return getTravelDuration(filter.near, locStr, (filter.by == FOOT) ? 'walking' : 'driving').then((travelDuration) => {
		const priceMatch = true; // TODO: we need to add pricing information to the restaurant data blob
		return (travelDuration < ((filter.by == FOOT) ? 10 : 30)) && priceMatch;
	}).catch(e => { // TODO: do I need this one?
		throw e;
	});
};

const hestonBot = (state = {users: {}, reviews: []}, message, data) => {
	if(message.match(new RegExp(`^${data.botId} review `))) {
		const restaurant = message.replace(new RegExp(`^${data.botId} review `), '');
		const userState = {state: AWAITING_RESTAURANT_CONFIRMATION, restaurant};
		const updatedState = assocPath(['users', data.user.id], userState, state);
		const asyncMessage = data.getPlaceInfo(restaurant).then(placeInfo => {
			void (updatedState.users[data.user.id].placeInfo = placeInfo);
			return placeInfo.tripAdvisorLink;
		}).catch(e => {
			throw e;
		});

		return action(updatedState, [
			userMessage(data.user.name, asyncMessage),
			userMessage(data.user.name, 'Is this the restaurant you want to review?')
		]);
	}
	else if(message.match(new RegExp(`^${data.botId} show me`))) {
		const updatedState = dissocPath(['users', data.user.id, 'qualifyingRestaurants'], state);
		const sortedReviews = state.users[data.user.id].qualifyingRestaurants.sort((r1, r2) => r1.rating < r2.rating);
		const userMessages = sortedReviews.map((review, index) => {
			const reviewText =
`*${index + 1}.* '${review.placeInfo.name}' was rated *${review.rating}* :star: by *${review.user}*

> ${review.description}

${review.placeInfo.tripAdvisorLink}

Google Rating: *${review.placeInfo.rating}* :star:
`;
			return userMessage(data.user.name, reviewText);
		});

		return action(updatedState, userMessages);
	}
	else {
		const parsedSentence = sentenceParser(message);

		if(parsedSentence) {
			const reviewFilter = createReviewFilter(parsedSentence, data.getTravelDuration);
			const asyncMessage = filter(state.reviews, reviewFilter).then((qualifyingRestaurants) => {
				if(qualifyingRestaurants.length === 0) {
					return `Sorry, I've got nothing for you. People near ${parsedSentence.near} have yet to share any restaurant recommendations with me.`;
				}
				else {
					void (state.users[data.user.id].qualifyingRestaurants = qualifyingRestaurants);
					const nearDescription = (parsedSentence.by === FOOT) ? 'less than 10min by foot' : 'less than 30min on public transport';
					const type = (parsedSentence.price === HIGH) ? 'exclusive ' : ((parsedSentence.price === LOW) ? 'affordable ' : '');
					return `I have ${qualifyingRestaurants.length} recommendation(s) for ${type}restaurants near ${parsedSentence.near} (${nearDescription}) from other ${companyData.companyName} staff if you're interested?\nType \`@heston show me\` to see them.`;
				}
			}).catch(e => {
				throw e;
			});

			return action(state, [
				userMessage(data.user.name, asyncMessage)
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
