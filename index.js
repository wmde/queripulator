'use strict';

const http = require( 'http' );
const https = require( 'https' );
const process = require( 'process' );

const OptimizingHandler = require( './lib/OptimizingHandler' );
const QueryHandlerChain = require( './lib/QueryHandlerChain' );
const SpecificItemPropertyPairQueryHandler = require( './lib/SpecificItemPropertyPairQueryHandler' );
const stats = require( './lib/stats' );
const SubjectByPropertyValueHandler = require( './lib/SubjectByPropertyValueHandler' );

const port = process.argv[ 2 ] || 8080;

const queryHandlerChain = new QueryHandlerChain( [
	new SpecificItemPropertyPairQueryHandler(),
	new OptimizingHandler(),
	new SubjectByPropertyValueHandler(),
] );

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
			const result = queryHandlerChain.getResult( url.searchParams.get( 'query' ) );
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
			wdqsResponse.pipe( clientResponse, { end: true } );
		},
	);
	clientRequest.pipe( wdqsRequest, { end: true } );
} );

process.on( 'SIGTERM', () => {
	server.close( () => {
		stats.dump( process.stdout );
	} );
} );

server.listen( port );
