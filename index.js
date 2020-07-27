'use strict';

const http = require( 'http' );
const https = require( 'https' );

const port = process.argv[ 2 ] || 8080;

http.createServer( function ( clientRequest, clientResponse ) {
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
} ).listen( port );
