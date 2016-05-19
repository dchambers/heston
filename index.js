// TODO:
//  1. Find out why we keep getting the wrong locations.
//  2. encode URLs in a way that allows them to be clicked from the terminal
//  2. Have Heston automatically announce himself on any channels that have foody words in them, and let him explain how reviews can be provided and

/* global console */
/* eslint-disable no-console */
import SlackBot from 'slackbots';
import storage from 'node-persist';
import companyData from './companyData';
import process from 'process';
import hestonBot from './src/hestonBot';
import {getPlaceInfo, getTravelDuration} from './src/utils';

const log = console.log;

process.on('unhandledRejection', (e) => {
	throw e;
});

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
			const channel = bot.channels.filter((channel) => channel.id === data.channel)[0];
			const group = bot.groups.filter((group) => group.id === data.channel)[0];
			const channelId = (group) ? '#' + group.name : ((channel) ? '#' + channel.name : '@' + user.name);
			const botData = {user, channel: channelId, botId, getPlaceInfo, getTravelDuration};
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

						case 'REPLY': {
							if(channel) {
								log(`> #${channel.name}: ${m.message}`);
								bot.postMessageToChannel(channel.name, m.message, params);
							}
							else if(group) {
								log(`> #${group.name}: ${m.message}`);
								bot.postMessageToGroup(group.name, m.message, params);
							}
							else {
								log(`> @${user.name}: ${m.message}`);
								bot.postMessageToUser(user.name, m.message, params);
							}

							break;
						}
					}
				}
			});
		}
	});

	const state = storage.getItem('state');
	const recommendationCount = (state) ? state.reviews.length : 0;
	console.log(`Heston is ready, and armed with ${recommendationCount} recommendation(s).`);
});
