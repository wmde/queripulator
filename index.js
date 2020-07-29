'use strict';

const http = require( 'http' );
const https = require( 'https' );
const process = require( 'process' );

const defaultQueryHandlerChain = require( './lib/defaultQueryHandlerChain' );
const stats = require( './lib/stats' );

const port = process.argv[ 2 ] || 8080;

function isJsonType( mimeType ) {
	switch ( mimeType ) {
		case 'application/sparql-results+json': return true;
		case 'application/json': return true;
		default: return false;
	}
}

const server = http.createServer( function ( clientRequest, clientResponse ) {
	const extraResponseHeaders = {};
	if ( clientRequest.method === 'GET' && isJsonType( clientRequest.headers.accept ) ) {
		const url = new URL( clientRequest.url, 'http://localhost' );
		if ( url.pathname === '/sparql' && url.searchParams.has( 'query' ) ) {
			const result = defaultQueryHandlerChain.getResult( url.searchParams.get( 'query' ) );
			stats.incrementCounter( `handler.result.${result.constructor.name}` );
			result.respond( clientRequest, clientResponse );
			return;
		}
	}

	if ( clientRequest.url === '/queripulator-stats' ) {
		clientResponse.writeHead( 200, { 'content-type': 'application/json' } );
		stats.dump( clientResponse );
		clientResponse.end();
		return;
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
			wdqsResponse.pipe( clientResponse );
		},
	);
	clientRequest.pipe( wdqsRequest );
} );

process.on( 'SIGTERM', () => {
	server.close( () => {
		stats.dump( process.stdout );
	} );
} );

server.listen( port );
