'use strict';

const axios = require( 'axios' );
const MockReq = require( 'mock-req' );
const MockRes = require( 'mock-res' );
const { Readable } = require( 'stream' );
const WdqsRequest = require( '../lib/WdqsRequest' );

jest.mock( 'axios' );

describe( 'WdqsRequest', () => {

	beforeEach( jest.clearAllMocks );

	function mockAxiosResponse( response = {} ) {
		return {
			status: response.status || 200,
			headers: response.headers || {},
			data: response.data || Readable.from( [] ),
		};
	}

	it( 'URL-encodes the query', async () => {
		const request = new WdqsRequest( 'ASK { ?s ?p ?o. }' );
		axios.get.mockResolvedValue( mockAxiosResponse() );
		await request.respond( new MockReq(), new MockRes() );
		expect( axios.get ).toHaveBeenCalledTimes( 1 );
		expect( axios.get.mock.calls[ 0 ][ 0 ] ).toBe(
			'https://query.wikidata.org/sparql?query=ASK%20%7B%20%3Fs%20%3Fp%20%3Fo.%20%7D',
		);
	} );

	it( 'extends the user agent', async () => {
		const request = new WdqsRequest( '' );
		axios.get.mockResolvedValue( mockAxiosResponse() );
		request.respond(
			new MockReq( { headers: { 'user-agent': 'foo bar' } } ),
			new MockRes(),
		);
		expect( axios.get ).toHaveBeenCalledTimes( 1 );
		expect( axios.get.mock.calls[ 0 ][ 1 ].headers[ 'user-agent' ] ).toBe(
			'foo bar Queripulator/1.0.0',
		);
	} );

	it( 'streams response data', async () => {
		const request = new WdqsRequest( '' );
		axios.get.mockResolvedValue( mockAxiosResponse( {
			data: Readable.from( [ 'data1', 'data2' ] ),
		} ) );
		const response = new MockRes();
		await request.respond( new MockReq(), response );
		await new Promise( ( resolve ) => response.on( 'finish', resolve ) );
		// eslint-disable-next-line no-underscore-dangle
		expect( response._getString() ).toBe( 'data1data2' );
	} );

	it( 'closes response on axios error', async () => {
		const request = new WdqsRequest( '' );
		axios.get.mockRejectedValue();
		const response = new MockRes();
		jest.spyOn( response, 'end' );
		await request.respond( new MockReq(), response );
		expect( response.end ).toHaveBeenCalledTimes( 1 );
		expect( response.statusCode ).toBe( 500 );
	} );

} );
