'use strict';

const http = require( 'http' );
const https = require( 'https' );

const QueryHandlerChain = require( './lib/QueryHandlerChain' );

const port = process.argv[ 2 ] || 8080;

const queryHandlerChain = new QueryHandlerChain( [] );

http.createServer( function ( clientRequest, clientResponse ) {
	const extraResponseHeaders = {};
	if ( clientRequest.method === 'GET' ) {
		const url = new URL( clientRequest.url, 'http://localhost' );
		if ( url.pathname === '/sparql' && url.searchParams.has( 'query' ) ) {
			const result = queryHandlerChain.getResult( url.searchParams.get( 'query' ) );
			extraResponseHeaders[ 'X-Simple-Query' ] = result.isSimple() ? 'true' : 'false';
		}
	}

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
			clientResponse.writeHead(
				wdqsResponse.statusCode,
				{
					...wdqsResponse.headers,
					...extraResponseHeaders,
				},
			);
			wdqsResponse.pipe( clientResponse, { end: true } );
		},
	);
	clientRequest.pipe( wdqsRequest, { end: true } );
} ).listen( port );
