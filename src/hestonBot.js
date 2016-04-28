/* eslint "no-implicit-side-effects/no-implicit-side-effects": "error" */
import {assoc, assocPath} from 'ramda';

const AWAITING_RESTAURANT_CONFIRMATION = 1;
const AWAITING_RATING = 2;
const AWAITING_REVIEW = 3;
const COMPLETE = 3;

const action = (state, messages) => ({state, messages});
const userMessage = (user, message) => ({type:'USER', user, message});

const hestonBot = (state = {users: {}, reviews: []}, message, data) => {
	if(message.match(/^heston review /)) {
		const restaurant = message.replace(/^heston review /, '');
		const userState = {state: AWAITING_RESTAURANT_CONFIRMATION, restaurant};
		const updatedState = assocPath(['users', data.user.id], userState, state);

		return action(updatedState, [
			userMessage(data.user.name, data.getTripAdvisorPage(restaurant)),
			userMessage(data.user.name, 'Is this the restaurant you want to review?')
		]);
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
				const updatedState = assocPath(['users', data.user.id], {...userState, rating: message, state: AWAITING_REVIEW}, state);
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
			const restaurantReview = {...userState, user: data.user.name, description: message, state: COMPLETE};
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
