'use strict';

const http = require( 'http' );
const https = require( 'https' );

const port = process.argv[ 2 ] || 8080;

const wdqsProxy = {
	analyse( _clientRequest ) {
		return true; // this is the last fallback, it always matches
	},
	handle( analyseResult, clientRequest, clientResponse ) {
		const wdqsRequest = https.request(
			'https://query.wikidata.org',
			{
				path: clientRequest.url,
				method: clientRequest.method,
				headers: {
					...clientRequest.headers,
					host: 'query.wikidata.org',
				},
			},
			function ( wdqsResponse ) {
				clientResponse.writeHead( wdqsResponse.statusCode, wdqsResponse.headers );
				wdqsResponse.pipe( clientResponse, { end: true } );
			},
		);
		clientRequest.pipe( wdqsRequest, { end: true } );
	},
};

const handlers = [
	wdqsProxy,
];

http.createServer( function ( clientRequest, clientResponse ) {
	for ( const handler of handlers ) {
		const analyseResult = handler.analyse( clientRequest );
		if ( analyseResult ) {
			handler.handle( analyseResult, clientRequest, clientResponse );
			return;
		}
	}
	// this should never happen, the last handler should always match
	clientResponse.writeHead( 500 );
	clientResponse.end( 'No suitable handler found.\n' );
} ).listen( port );
