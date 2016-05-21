/* eslint "no-implicit-side-effects/no-implicit-side-effects": "error" */
import {assoc, assocPath, dissoc, dissocPath} from 'ramda';
import filter from 'array-promise-filter';
import {sentenceParser, FOOT, LOW, HIGH} from './sentenceParser';
import config from '../config';

const AWAITING_RESTAURANT_CONFIRMATION = 1;
const AWAITING_RATING = 2;
const AWAITING_REVIEW = 3;

const action = (state, messages) => ({state, messages});
const reply = (message) => ({type:'REPLY', message});
// const userMessage = (user, message) => ({type:'USER', user, message});

const removeStateProp = dissoc('state');

const logMessage = (channel, message) => {
	void(console.log(`< ${channel}: ${message}`)); // eslint-disable-line no-console
};

const createReviewFilter = (filter, getTravelDuration) => (review) => {
	const loc = review.placeInfo.geometry.location;
	const locStr = loc.lat + ',' + loc.lng;
	return getTravelDuration(filter.near, locStr, (filter.by == FOOT) ? 'walking' : 'driving').then((travelDuration) => {
		const priceMatch = true; // TODO: we need to add pricing information to the restaurant data blob
		return (travelDuration < ((filter.by == FOOT) ? 10 : 30)) && priceMatch;
	});
};

const hestonBot = (state = {users: {}, reviews: []}, message, data) => {
	if(message.match(new RegExp(`^${data.botId} review `))) {
		void(logMessage(data.channel, message));
		const restaurant = message.replace(new RegExp(`^${data.botId} review `), '');
		const conversationState = {state: AWAITING_RESTAURANT_CONFIRMATION, restaurant};
		const updatedState = assocPath(['users', data.user.id, data.channel], conversationState, state);
		const asyncMessage = data.getPlaceInfo(restaurant).then(placeInfo => {
			void (updatedState.users[data.user.id][data.channel].placeInfo = placeInfo);
			return placeInfo.tripAdvisorLink;
		});

		return action(updatedState, [
			reply(asyncMessage),
			reply('Is this the restaurant you want to review?')
		]);
	}
	else if(message.match(new RegExp(`^show me`))) {
		void(logMessage(data.channel, message));
		const updatedState = dissocPath(['users', data.user.id, data.channel, 'qualifyingRestaurants'], state);
		const sortedReviews = state.users[data.user.id][data.channel].qualifyingRestaurants.sort((r1, r2) => r1.rating < r2.rating);
		const senderessages = sortedReviews.map((review, index) => {
			const reviewText =
`*${index + 1}.* '${review.placeInfo.name}' was rated *${review.rating}* :star: by *${review.user}*

> ${review.description}

${review.placeInfo.tripAdvisorLink}

Google Rating: *${review.placeInfo.rating}* :star:
`;
			return reply(reviewText);
		});

		return action(updatedState, senderessages);
	}
	else {
		void(logMessage(data.channel, message));
		const parsedSentence = sentenceParser(message);

		if(parsedSentence) {
			const reviewFilter = createReviewFilter(parsedSentence, data.getTravelDuration);
			const asyncMessage = filter(state.reviews, reviewFilter).then((qualifyingRestaurants) => {
				if(qualifyingRestaurants.length === 0) {
					return `Sorry, I've got nothing for you. People near ${parsedSentence.near} have yet to share any restaurant recommendations with me.`;
				}
				else {
					const userState = state.users[data.user.id];
					void (state.users[data.user.id] = assocPath([data.channel, 'qualifyingRestaurants'], qualifyingRestaurants, userState));
					const nearDescription = (parsedSentence.by === FOOT) ? 'less than 10min by foot' : 'less than 30min on public transport';
					const type = (parsedSentence.price === HIGH) ? 'exclusive ' : ((parsedSentence.price === LOW) ? 'affordable ' : '');
					return `I have ${qualifyingRestaurants.length} recommendation(s) for ${type}restaurants near ${parsedSentence.near} (${nearDescription}) from other ${config.company.name} staff if you're interested?\nType \`show me\` to see them.`;
				}
			});

			return action(state, [
				reply(asyncMessage)
			]);
		}
	}

	const userState = state.users[data.user.id] || {};
	const conversationState = userState[data.channel] || {};
	switch(conversationState.state) {
		case AWAITING_RESTAURANT_CONFIRMATION: {
			if(message.match(/yes/)) {
				const updatedState = assocPath(['users', data.user.id, data.channel], {...conversationState, state: AWAITING_RATING}, state);
				return action(updatedState, [
					reply('What\'s your rating from 0 to 5?')
				]);
			}
			else {
				const updatedState = assocPath(['users', data.user.id, data.channel], {}, state);
				return action(updatedState, [
					reply('Okay, please try entering the name differently.')
				]);
			}
		}

		case AWAITING_RATING: {
			if(message.match(/[0-5]/)) {
				const updatedState = assocPath(['users', data.user.id, data.channel], {...conversationState, rating: Number(message), state: AWAITING_REVIEW}, state);
				return action(updatedState, [
					reply('Thanks! Can you please provide some textual content to justify that rating.')
				]);
			}
			else {
				const updatedState = assocPath(['users', data.user.id, data.channel], {}, state);
				return action(updatedState, [
					reply('Fine, consider this conversation over!!')
				]);
			}
		}

		case AWAITING_REVIEW: {
			const restaurantReview = removeStateProp({...conversationState, user: data.user.name, description: message});
			const updatedState = assocPath(['users', data.user.id, data.channel], {}, state);
			const updatedState2 = assoc('reviews', [...updatedState.reviews, restaurantReview], updatedState);

			return action(updatedState2, [
				reply('Your review has been noted my friend!')
			]);
		}

		default: {
			return action(state, []);
		}
	}
};

export default hestonBot;
