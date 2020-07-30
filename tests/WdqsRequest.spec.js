'use strict';

const https = require( 'https' );
const MockReq = require( 'mock-req' );
const MockRes = require( 'mock-res' );
const { Readable } = require( 'stream' );
const WdqsRequest = require( '../lib/WdqsRequest' );

jest.mock( 'https' );

describe( 'WdqsRequest', () => {

	beforeEach( jest.clearAllMocks );

	function mockResponse( response = {} ) {
		const mockRes = new MockRes();
		mockRes.writeHead( response.statusCode || 200, response.headers || {} );
		( response.data || Readable.from( [] ) ).pipe( mockRes );
		return mockRes;
	}

	it( 'URL-encodes the query', () => {
		const request = new WdqsRequest( 'ASK { ?s ?p ?o. }' );
		request.respond( new MockReq(), new MockRes() );
		expect( https.get ).toHaveBeenCalledTimes( 1 );
		expect( https.get.mock.calls[ 0 ][ 0 ] ).toBe(
			'https://query.wikidata.org/sparql?query=ASK%20%7B%20%3Fs%20%3Fp%20%3Fo.%20%7D',
		);
	} );

	it( 'extends the user agent', async () => {
		const request = new WdqsRequest( '' );
		request.respond(
			new MockReq( { headers: { 'user-agent': 'foo bar' } } ),
			new MockRes(),
		);
		expect( https.get ).toHaveBeenCalledTimes( 1 );
		expect( https.get.mock.calls[ 0 ][ 1 ].headers[ 'user-agent' ] ).toBe(
			'foo bar Queripulator/1.0.0',
		);
	} );

	it( 'streams response data', async () => {
		const request = new WdqsRequest( '' );
		https.get.mockImplementation( ( _url, _options, callback ) => {
			callback( mockResponse( {
				data: Readable.from( [ 'data1', 'data2' ] ),
			} ) );
		} );
		const response = new MockRes();
		request.respond( new MockReq(), response );
		await new Promise( ( resolve ) => response.on( 'finish', resolve ) );
		// eslint-disable-next-line no-underscore-dangle
		expect( response._getString() ).toBe( 'data1data2' );
	} );

	it( 'forwards non-2xx status code', async () => {
		const request = new WdqsRequest( '' );
		https.get.mockImplementation( ( _url, _options, callback ) => {
			callback( mockResponse( {
				statusCode: 500,
			} ) );
		} );
		const response = new MockRes();
		request.respond( new MockReq(), response );
		await new Promise( ( resolve ) => response.on( 'finish', resolve ) );
		expect( response.statusCode ).toBe( 500 );
	} );

} );
