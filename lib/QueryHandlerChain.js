'use strict';

const parser = require( './sparqlParser' );
const WdqsRequest = require( './WdqsRequest' );

module.exports = class QueryHandlerChain {

	constructor( queryHandlers ) {
		this.queryHandlers = queryHandlers;
	}

	getResult( query ) {
		let parsedQuery;
		try {
			parsedQuery = parser.parse( query );
		} catch ( e ) {
			parsedQuery = null;
		}
		for ( const queryHandler of this.queryHandlers ) {
			try {
				const result = queryHandler.handle( query, parsedQuery );
				if ( result ) {
					return result;
				}
			} catch ( e ) {
				console.error( e );
				// continue with other handlers
			}
		}

		return new WdqsRequest( query );
	}

};
