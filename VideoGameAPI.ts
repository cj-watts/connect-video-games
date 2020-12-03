import {VideoGame} from "./types/VideoGame";
import axios, {AxiosResponse} from "axios";
import wordsToNumbers from "words-to-numbers";
import {toRoman} from 'roman-numerals';

export class VideoGameAPI {
	token: {
		"access_token": string;
		"expires": number;
	}
	client: string;
	secret: string;

	constructor() {
		//Environment variables set at runtime from parameter store
		this.client = process.env.API_CLIENT;
		this.secret = process.env.API_SECRET;
		if (!this.client || !this.secret) {
			throw new Error('Client or Secret not set')
		}
	}

	/**
	 * @summary Get an array of 4 games based on an array of game ids passed in
	 * @param gameIds
	 */
	getSimilarGames(gameIds: number[]) {
		return this.getGameData(`fields *; where id = (${gameIds.slice(0, 4).join(',')});`)
	}

	/**
	 * @summary
	 * @param title
	 */
	async getGameInfo(title): Promise<VideoGame> {
		return (await this.getGameData(`fields *; where ${this.getNameParameter(title)}`))[0]
	}

	/**
	 * @summary turn an array of video games into a single string of their titles
	 * @param games
	 */
	getTitlesString(games: VideoGame[]): string {
		let titles = '';
		for (let i = 0; i < games.length; i++) {
			if (i === games.length - 1) {
				titles += 'and ' + games[i].name + '.';
			} else {
				titles += games[i].name + ', ';
			}
		}
		return titles;
	}
	/**
	 * @summary convert numbers to the different formats that video games use and combine to make a single where
	 * @param title
	 */
	 getNameParameter(title:string){
		const originalTitle = title.replace(/mario cart/ig,'mario kart');

		const titles:string[] = ['"'+ originalTitle+ '"'];
		const arabicNumbers = wordsToNumbers(originalTitle) + ''
		titles.push('"'+arabicNumbers+ '"')
		let results = /\d+/.exec(arabicNumbers)
		if(results && results[0]){
			titles.push('"'+ arabicNumbers.replace(results[0], toRoman(results[0]))+ '"')
		}
		return 'name ~ ' + titles.join(' | name ~ ') + ';'
	}
	/**
	 * @summary Get an array of games based on the body filter passed in
	 * @param body
	 */
	async getGameData(body: string): Promise<VideoGame[]> {
		const token = await this.getApiToken();
		const response: AxiosResponse<VideoGame[]> = await axios({
			url: "https://api.igdb.com/v4/games",
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Client-ID': this.client,
				'Authorization': 'Bearer ' + token.access_token,
				'Content-Type': 'text/plain'
			},
			data: body
		})
		return response.data
	}

	async getApiToken() {
		if(!this.token || this.token.expires >= new Date().getTime()){
			let token = (await axios({
				url: 'https://id.twitch.tv/oauth2/token',
				method: 'POST',
				params: {
					'client_id': this.client,
					'client_secret': this.secret,
					'grant_type': 'client_credentials'
				}
			})).data
			this.token = {
				access_token: token.access_token,
				expires: new Date().getTime() + token.expires_in,
			}
		}
		return this.token
	}
}
