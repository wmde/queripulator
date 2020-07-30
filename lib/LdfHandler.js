'use strict';

const SparqlGenerator = require( 'sparqljs' ).Generator;

const LdfRequest = require( './LdfRequest' );

module.exports = class LdfHandler {

	constructor() {
		this.generator = new SparqlGenerator();
	}

	handle( _query, parsedQuery ) {
		// In theory, LDF can handle almost any query (except ones with custom SERVICEs),
		// including with OPTIONALs, FILTERs, etc. (with more or less client-side processing);
		// we limit it (somewhat arbitrarily) to queries with a single Basic Graph Pattern
		// (which may have any number of triples).
		if ( !parsedQuery ||
			parsedQuery.queryType !== 'SELECT' ||
			parsedQuery.where.length !== 1 ||
			parsedQuery.where[ 0 ].type !== 'bgp'
		) {
			return;
		}

		// Bug in ldf-client: if the SparqlIterator is transformed,
		// the SparqlResultWriter no longer has access to the variables,
		// so the head will be empty.
		if ( parsedQuery.distinct || 'offset' in parsedQuery || 'limit' in parsedQuery ) {
			return;
		}

		// Bug in ldf-client: with SELECT *, the head will be empty.
		if ( parsedQuery.variables[ 0 ].termType === 'Wildcard' ) {
			return;
		}

		// re-stringify the parsed query to ensure it has all the right prefixes
		return new LdfRequest( this.generator.stringify( parsedQuery ) );
	}

};
