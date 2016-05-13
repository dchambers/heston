/* global console */
/* eslint-disable no-console */
import SlackBot from 'slackbots';
import storage from 'node-persist';
import companyData from './companyData';
import hestonBot from './src/hestonBot';
import {getPlaceInfo, getTravelDuration} from './src/utils';

// create a bot
var bot = new SlackBot(companyData);

storage.initSync({
	continuous: false,
	interval: 500
});

bot.on('start', function() {
	const botUser = bot.users.filter((user) => (user.name == 'heston'))[0];
	const botId = `<@${botUser.id}>`;
	const params = {
		icon_emoji: ':cherries:',
		unfurl_links: true
	};

	bot.on('message', function(data) {
		if(data.type == 'message' && data.text && data.bot_id === undefined) {
			const user = bot.users.filter((user) => user.id === data.user)[0];
			const botData = {user, botId, getPlaceInfo, getTravelDuration};
			const result = hestonBot(storage.getItem('state'), data.text, botData);
			storage.setItem('state', result.state);

			const asyncMessages = result.messages.map(
				(m) => (!m.message.then) ?
					Promise.resolve(m) :
					m.message.then(message => ({...m, message}))
			);
			Promise.all(asyncMessages).then((resolvedMessages) => {
				for(const m of resolvedMessages) {
					switch(m.type) {
						case 'USER': {
							bot.postMessageToUser(m.user, m.message, params);
							break;
						}

						// TODO...
					}
				}
			});
		}
	});

	const state = storage.getItem('state');
	const recommendationCount = (state) ? state.reviews.length : 0;
	console.log(`Heston is ready, and armed with ${recommendationCount} recommendation(s).`);
});
