import {ConnectContactFlowResult, ConnectContactFlowHandler} from 'aws-lambda';
import 'source-map-support/register';
import axios, {AxiosResponse} from 'axios';
import wordsToNumbers from 'words-to-numbers';
import { toRoman } from 'roman-numerals';
import {VideoGame} from "./types/VideoGame";
export const getInfo: ConnectContactFlowHandler = async (event, _context) => {
	const title = event.Details.Parameters.VideoGameTitle
	const currentIntent = event.Details.Parameters.currentIntent;
	let messageContent = "I couldn't find the requested information for " + title;
	console.log(currentIntent);
	try {
		switch (currentIntent){
			case 'info':
				const videoGameData= await getGameInfo(title);
				messageContent = videoGameData?.summary || messageContent
				break;
			case 'suggestion':
				const customerGame = await getGameInfo(title);
				const similarGames = await getSimilarGames(customerGame.similar_games)
				let titles = '';
				for(let i=0; i<similarGames.length; i++){
					if(i=== similarGames.length-1){
						titles += 'and ' + similarGames[i].name + '.';
					}else{
						titles += similarGames[i].name + ', ';
					}

				}
				messageContent = `Some games that are similar to ${customerGame.name} are ${titles}`
				break;
			default:
				console.error("Unknown intent was passed in: " + currentIntent );
		}

	} catch (e){
		if(e.response){
			console.error(e.response.data)
		}else{
			console.error(e);
		}
		return getResponse("There was an error getting the information please try again later")
	}


  return getResponse(messageContent);
}

function getResponse(content): ConnectContactFlowResult{
	return {
		message:content
	}
}
function getSimilarGames(gameIds:number[]){
	return getGameData(`fields *; where id = (${gameIds.slice(0,4).join(',')});`)
}
async function getGameInfo(title):Promise<VideoGame>{
	const arabicNumbers = wordsToNumbers(title) + ''
	let results = /\d+/.exec(arabicNumbers)
	if(results && results[0]){
		let romanTitle = arabicNumbers.replace(results[0], toRoman(results[0]));
		return (await getGameData(`fields *; where name ~ "${title}" | name ~ "${arabicNumbers}" | name ~ "${romanTitle}";`))[0]
	}
	return (await getGameData(`fields *; where name ~ "${title}" | name ~ "${arabicNumbers}";`))[0]

}
async function getGameData(body: string):Promise<VideoGame[]>{
	const client = process.env.API_CLIENT;
	const secret = process.env.API_SECRET;
	if(!client || !secret){
		throw new Error('Client or Secret not set')
	}
	const token = (await axios({
		url: 'https://id.twitch.tv/oauth2/token',
		method: 'POST',
		params: {
			'client_id': client,
			'client_secret': secret,
			'grant_type': 'client_credentials'
		}
	})).data
	const response:AxiosResponse<VideoGame[]> = await axios({
		url: "https://api.igdb.com/v4/games",
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Client-ID': client,
			'Authorization': 'Bearer ' + token.access_token,
			'Content-Type': 'text/plain'
		},
		data: body
	})
	return response.data
}
