import {LexHandler, LexResult} from 'aws-lambda';
import 'source-map-support/register';
import axios from 'axios';
import wordsToNumbers from 'words-to-numbers';
export const videoGame: LexHandler = async (event, _context) => {
	const titleNumbers = wordsToNumbers(event.currentIntent.slots.VideoGameTitle);
	const title = wordsToNumbers(event.currentIntent.slots.VideoGameTitle);
	const client = process.env.API_CLIENT;
	const secret = process.env.API_SECRET;

	let messageContent = "I couldn't find a summary for " + title;
	if(!client || !secret){
		return getLexResponse(
			'There was a problem accessing the video game please try again later',
			'Failed'
		);
	}
	try {
		const token = (await axios({
			url: 'https://id.twitch.tv/oauth2/token',
			method: 'POST',
			params: {
				'client_id': client,
				'client_secret': secret,
				'grant_type': 'client_credentials'
			}
		})).data
		const response = await axios({
			url: "https://api.igdb.com/v4/games",
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Client-ID': client,
				'Authorization': 'Bearer ' + token.access_token,
				'Content-Type': 'text/plain'
			},
			data: `fields summary; where name ~ "${title}" | name ~ "${titleNumbers}";`
		})

		messageContent = response.data[0]?.summary || messageContent
		console.log(response.data);
	} catch (e){
		console.error(e);
		return getLexResponse("There was an error getting the information please try again later",
			'Failed'
			)
	}


  return getLexResponse(messageContent);
}

function getLexResponse(content, status: 'Fulfilled'| 'Failed'='Fulfilled'): LexResult{
	return {
		dialogAction:{
			fulfillmentState: status,
			type:'Close',
			message: {
				contentType: "PlainText",
				content
			}

		}
	}
}
