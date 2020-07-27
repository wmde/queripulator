const http = require( 'http' );
const https = require( 'https' );

const port = process.argv[ 2 ] || 8080;

http.createServer( function( client_request, client_response ) {
	const wdqs_request = https.request(
		'https://query.wikidata.org',
		{
			path: client_request.url,
			method: client_request.method,
			headers: {
				...client_request.headers,
				host: 'query.wikidata.org',
			},
		},
		function( wdqs_response ) {
			client_response.writeHead( wdqs_response.statusCode, wdqs_response.headers );
			wdqs_response.pipe( client_response, { end: true } );
		},
	);
	client_request.pipe( wdqs_request, { end: true } );
} ).listen( port );
