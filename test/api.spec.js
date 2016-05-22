import {describe, it} from 'mocha';
import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import hestonBot from '../src/hestonBot';
import {getPlaceInfo, getTravelDuration} from '../src/utils';

chai.use(chaiAsPromised);

const user = {id: 1, name: 'Fred'};
const data = () => ({user, botId: '@heston', getPlaceInfo, getTravelDuration});

describe('API usage', () => {
  it('makes use of Google and TripAdvisor to disambiguate restaurants', function() {
    this.timeout(10000);

		const result = hestonBot(undefined, '@heston review Krusty Burger, Sprinfield', data());
    expect(result.messages.length).to.equal(2);
    expect(result.messages[1].message).to.equal('Is this the restaurant you want to review?');
    return expect(result.messages[0].message).to.eventually.equal(
      'https://www.tripadvisor.co.uk/ShowUserReviews-g34515-d88229-r356909729-Extended_Stay_America_Orlando_Convention_Center_Universal_Blvd-Orlando_Florida.html');
	});
});
