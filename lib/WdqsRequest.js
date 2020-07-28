'use strict';

const axios = require( 'axios' );

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
				wdqsResponse.data.pipe( response, { end: true } );
			},
			( _wdqsError ) => {
				response.writeHead( 500 );
				response.end();
			},
		);
	}

};
