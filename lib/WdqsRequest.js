'use strict';

const axios = require( 'axios' );

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
			accept: 'application/sparql-results+json',
			'user-agent': `${request.headers[ 'user-agent' ]} Queripulator/1.0.0`,
		};
		axios.get( url, { headers, responseType: 'stream', validateStatus: null } ).then(
			( wdqsResponse ) => {
				response.writeHead(
					wdqsResponse.status,
					{
						...wdqsResponse.headers,
						...this.extraResponseHeaders,
					},
				);
				wdqsResponse.data.pipe( response );
			},
			( _wdqsError ) => {
				response.writeHead( 500 );
				response.end();
			},
		);
	}

};
