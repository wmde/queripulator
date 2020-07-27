'use strict';

const https = require( 'https' );

module.exports = class WdqsRequest {

	constructor( query, extraResponseHeaders = {} ) {
		this.query = query;
		this.extraResponseHeaders = extraResponseHeaders;
	}

	respond( request, response ) {
		const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent( this.query );
		https.get(
			url,
			{
				headers: {
					accept: 'application/sparql-results+json',
					'user-agent': `${request.headers[ 'user-agent' ]} Queripulator/1.0.0`,
				},
			},
			( wdqsResponse ) => {
				response.writeHead(
					wdqsResponse.statusCode,
					{
						...wdqsResponse.headers,
						...this.extraResponseHeaders,
					},
				);
				wdqsResponse.pipe( response, { end: true } );
			},
		).end();
	}

};
