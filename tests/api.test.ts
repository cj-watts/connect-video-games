import {expect} from 'chai'
import {VideoGameAPI} from '../VideoGameAPI';

describe('VideoGameAPI', function () {
	beforeEach(()=>{
		process.env.API_CLIENT = 'client';
		process.env.API_SECRET = 'secret';
	})
	it('should return correct title string', async function () {
		const api = new VideoGameAPI();
		// @ts-ignore
		expect(api.getTitlesString([{name:'1'},{name:'2'}])).to.equal('1, and 2.');
	});
	it('should return correct where name parameter string', async function () {
		const api = new VideoGameAPI();
		// @ts-ignore
		expect(api.getNameParameter('mario cart eight')).to.equal('name ~ "mario kart eight" | name ~ "mario kart 8" | name ~ "mario kart VIII";');
	});
})
