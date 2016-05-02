import {describe, it, before} from 'mocha';
import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import hestonBot from './hestonBot';

chai.use(chaiAsPromised);

const user = {id: 1, name: 'Fred'};
const getPlaceInfo = restaurant => Promise.resolve({tripAdvisorLink: '@' + restaurant});
const data = () => ({user, getPlaceInfo});

describe('conversation with Heston', () => {
	it('ignores conversations unless they start as expected', () => {
		const result = hestonBot(undefined, 'Yo!', data());
		expect(result.messages.length).to.equal(0);
	});

	describe('conversation after a restaurant is suggested', () => {
		let suggestionResult;

		before(() => {
			suggestionResult = hestonBot(undefined, 'heston review Krusty Burger', data());
		});

		it('asks the user to confirm restaurants they want to review', () => {
			expect(suggestionResult.messages.length).to.equal(2);
			expect(suggestionResult.messages[1].message).to.equal('Is this the restaurant you want to review?');
      return expect(suggestionResult.messages[0].message).to.eventually.equal('@Krusty Burger');
		});

		describe('conversation if the user confirms the restaurant', () => {
			let confirmedResult;

			before(() => {
				confirmedResult = hestonBot(suggestionResult.state, 'yes', data());
			});

			it('asks for a rating once the user has confirmed the restaurant', () => {
				expect(confirmedResult.messages.length).to.equal(1);
				expect(confirmedResult.messages[0].message).to.equal('What\'s your rating from 0 to 5?');
			});

			describe('conversation if the user provides a rating', () => {
				let ratedResult;

				before(() => {
					ratedResult = hestonBot(confirmedResult.state, '5', data());
				});

				it('asks for a description if a rating is provided', () => {
					expect(ratedResult.messages.length).to.equal(1);
					expect(ratedResult.messages[0].message).to.equal('Thanks! Can you please provide some textual content to justify that rating.');
				});

				describe('conversation once the user has provided a description', () => {
					let describedResult;
					let reviewData;

					before(() => {
						describedResult = hestonBot(ratedResult.state, 'A++++', data());
						reviewData = describedResult.state.reviews[0];
					});

					it('thanks the user for their review', () => {
						expect(describedResult.messages.length).to.equal(1);
						expect(describedResult.messages[0].message).to.equal('Your review has been noted my friend!');
					});

					it('now has review data permanently available', () => {
						expect(reviewData).to.deep.equal({
							description: 'A++++',
							rating: 5,
							restaurant: 'Krusty Burger',
							user: 'Fred',
							placeInfo: {
								tripAdvisorLink: '@Krusty Burger'
							}
						});
					});

					it('ignores subsequent random input', () => {
						const result = hestonBot(describedResult.state, 'Hi', data());
						expect(result.messages.length).to.equal(0);
					});

					it('allows a new review to be started', () => {
						const result = hestonBot(describedResult.state, 'heston review Mo\'s Diner', data());
						expect(result.messages.length).to.equal(2);
						expect(result.messages[1].message).to.equal('Is this the restaurant you want to review?');
            return expect(result.messages[0].message).to.eventually.equal('@Mo\'s Diner');
					});
				});
			});

			describe('conversation if the user does not provide a rating', () => {
				let unratedResult;

				before(() => {
					unratedResult = hestonBot(confirmedResult.state, 'Nice day eh?', data());
				});

				it('has a strop if no rating is provided', () => {
					expect(unratedResult.messages.length).to.equal(1);
					expect(unratedResult.messages[0].message).to.equal('Fine, consider this conversation over!!');
				});

				it('does not allow the user to subsequently provide a rating once they have failed to', () => {
					const result = hestonBot(unratedResult.state, '5', data());
					expect(result.messages.length).to.equal(0);
				});
			});
		});

		describe('conversation if the user does not confirm the restaurant', () => {
			let unconfirmedResult;

			before(() => {
				unconfirmedResult = hestonBot(suggestionResult.state, 'no', data());
			});

			it('asks the user to restart the conversation again if the restaurant can not be confirmed', () => {
				expect(unconfirmedResult.messages.length).to.equal(1);
				expect(unconfirmedResult.messages[0].message).to.equal('Okay, please try entering the name differently.');
			});

			it('does not allow the user to subsequently say yes and continue once they have said no', () => {
				const result = hestonBot(unconfirmedResult.state, 'no', data());
				expect(result.messages.length).to.equal(0);
			});
		});
	});
});
