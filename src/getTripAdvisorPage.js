import fetch from 'node-fetch';
import urlencode from 'urlencode';
import htmlparser from "htmlparser2";

export default function getTripAdvisorPage(restaurant) {
	return fetch('https://www.tripadvisor.co.uk/Search?q=' + urlencode(restaurant))
		.then(function(res) {
			return res.text();
		})
		.then(function(body) {
			var restaurantPageUrl;
			var parser = new htmlparser.Parser({
				onopentag: function(name, attribs) {
					if(name === 'div' && attribs.class === 'title' && attribs.onclick) {
						if(!restaurantPageUrl) {
							var restaurantPageUrlData = attribs.onclick.split(' ')[4];
							restaurantPageUrl = 'https://www.tripadvisor.co.uk' +
								restaurantPageUrlData.substring(1, restaurantPageUrlData.length - 2);
						}
					}
				}
			}, {decodeEntities: true});
			parser.write(body);
			parser.end();

			return restaurantPageUrl;
		});
}
