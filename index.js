import SlackBot from 'slackbots';
import storage from 'node-persist';
import companyData from './companyData';
import hestonBot from './src/hestonBot';
import {getPlaceInfo} from './src/utils';

// create a bot
var bot = new SlackBot(companyData);

storage.initSync({
  continuous: false,
  interval: 500
});

bot.on('start', function() {
  const params = {
    icon_emoji: ':cherries:',
    unfurl_links: true
  };

	bot.on('message', function(data) {
		if(data.type == 'message' && data.text && data.bot_id === undefined) {
			const user = bot.users.filter((user) => user.id === data.user)[0];
      const botData = {user, getPlaceInfo};
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
});
