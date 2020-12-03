import {ConnectContactFlowResult, ConnectContactFlowHandler} from 'aws-lambda';
import 'source-map-support/register';
import {VideoGameAPI} from "./VideoGameAPI";
/* Take advantage of Lambda warm/hot start by defining api outside the handler.
*  This means if a token was already retrieved it won't have to again.
*  Care must be taken that only the token and required info is stored on the object
*  otherwise there could be bleed over
*/
const api = new VideoGameAPI();
export const getInfo: ConnectContactFlowHandler = async (event, _context) => {

	const title = event.Details.Parameters.VideoGameTitle
	const currentIntent = event.Details.Parameters.currentIntent;
	//Default message in case the game doesn't exist or can't be found for some reason
	let messageContent = "I couldn't find the requested information for " + title;

	try {
		//
		switch (currentIntent){
			case 'info':
				const videoGameData= await api.getGameInfo(title);
				messageContent = videoGameData?.summary || messageContent
				break;
			case 'suggestion':
				const customerGame = await api.getGameInfo(title);
				const similarGames = await api.getSimilarGames(customerGame.similar_games)
				const titles = api.getTitlesString(similarGames);
				messageContent = `Some games that are similar to ${customerGame.name} are ${titles}`
				break;
			default:
				//This probably means the flow was not setup correct or a new intent was added without code
				console.error("Unknown intent was passed in: " + currentIntent );
				messageContent = "I'm sorry, there was an error processing your request"
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
