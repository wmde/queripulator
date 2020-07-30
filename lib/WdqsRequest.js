'use strict';

const https = require( 'https' );

/**
 * Request that simply forwards to WDQS, used as a final fallback.
 * Handlers that want this functionality are encouraged to use a subclass,
 * so that they can be tracked separately from the final fallback.
 */
module.exports = class WdqsRequest {

	constructor( query, extraResponseHeaders = {} ) {
		this.query = query;
		this.extraResponseHeaders = extraResponseHeaders;
	}

	respond( request, response ) {
		const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent( this.query );
		const headers = {
			...request.headers,
			host: 'query.wikidata.org',
			'user-agent': `${request.headers[ 'user-agent' ]} Queripulator/1.0.0`,
		};
		https.get( url, { headers }, ( wdqsResponse ) => {
			response.writeHead(
				wdqsResponse.statusCode,
				{
					...wdqsResponse.headers,
					...this.extraResponseHeaders,
				},
			);
			wdqsResponse.pipe( response );
		} );
	}

};
