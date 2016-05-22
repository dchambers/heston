import {describe, it} from 'mocha';
import {expect} from 'chai';
import {sentenceParser as parsedSentence, FOOT, PUBLIC_TRANSPORT, LOW, HIGH} from './sentenceParser';
import config from '../config';

describe('sentenceParser', () => {
	describe('restaurant recommendations', () => {
		const restaurant = {
			near: config.company.address,
			by: PUBLIC_TRANSPORT
		};

		it('recommends all prices of restaurant if asked for a general restaurant recommendation.', () => {
			expect(parsedSentence('Which restaurants should I be trying while I\'m in town?')).to.deep.equal(restaurant);
			expect(parsedSentence('Are there any good restaurants around here that people can recommend?')).to.deep.equal(restaurant);
			expect(parsedSentence('What are your favourite places to eat in New York?')).to.deep.equal({
				...restaurant,
				near: 'New York'
			});
		});

		it.skip('only recommends local restaurants if given a specific place.', () => {
			expect(parsedSentence('Any suggestions for restaurants near Euston St Pancras?')).to.deep.equal({
				near: 'Euston St Pancras',
				by: FOOT
			});
		});

		it('does not make recommendations when people are just talking about places they ate at.', () => {
			expect(parsedSentence('I had a really nice meal last night!')).to.be.null;
			expect(parsedSentence('Did you end up going to that restaurant I suggested yesterday?')).to.be.null;
			expect(parsedSentence('Did you end up going to that restaurant I suggested yesterday?')).to.be.null;
		});
	});

	describe('lunch recommendations', () => {
		const lunch = {
			price: LOW,
			near: config.company.address,
			by: FOOT
		};

		it('recommends good value places within walking distance for lunch.', () => {
			expect(parsedSentence('Where are the best places to get food near the office?')).to.deep.equal(lunch);
			expect(parsedSentence('Where\'s good for lunch?')).to.deep.equal(lunch);
			expect(parsedSentence('Any recommendations for lunch near here?')).to.deep.equal(lunch);
		});

		it('does not make recommendations when people are just talking about their lunch.', () => {
			expect(parsedSentence('Lunch was great today!')).to.be.null;
			expect(parsedSentence('Are people ready to go for lunch?')).to.be.null;
			expect(parsedSentence('It\'s lunch time people!')).to.be.null;
		});
	});

	describe('client meals', () => {
		const clientMeal = {
			price: HIGH,
			near: 'London',
			by: PUBLIC_TRANSPORT
		};

		it('Recommends pricey restaurants for client meals', () => {
			expect(parsedSentence('Can anybody recommend a good restaurant to take a client in London?')).to.deep.equal(clientMeal);
		});
	});

	describe('client lunches', () => {
		const clientLunch = {
			price: HIGH,
			near: config.company.address,
			by: FOOT
		};

		it('Recommends pricey but local restaurants for business lunches', () => {
			expect(parsedSentence('Where is good for a business lunch?')).to.deep.equal(clientLunch);
			expect(parsedSentence('Where would people recommend if I need to take a client for lunch?')).to.deep.equal(clientLunch);
		});
	});
});
