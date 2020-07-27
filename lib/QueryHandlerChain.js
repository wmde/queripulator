'use strict';

const SparqlParser = require( 'sparqljs' ).Parser;
const { allNamespaces } = require( './rdfNamespaces' );
const ComplexQueryResult = require( './ComplexQueryResult' );

module.exports = class QueryHandlerChain {

	constructor( queryHandlers ) {
		this.queryHandlers = queryHandlers;
		this.parser = new SparqlParser( { prefixes: allNamespaces } );
	}

	getResult( query ) {
		let parsedQuery;
		try {
			parsedQuery = this.parser.parse( query );
		} catch ( e ) {
			parsedQuery = null;
		}
		for ( const queryHandler of this.queryHandlers ) {
			if ( queryHandler.canHandle( query, parsedQuery ) ) {
				return queryHandler.getResult( query, parsedQuery );
			}
		}

		return new ComplexQueryResult();
	}

};
