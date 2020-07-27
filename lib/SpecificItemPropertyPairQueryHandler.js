'use strict';

const SparqlParser = require( 'sparqljs' ).Parser;
const { namespaceMap, allNamespaces } = require( './rdfNamespaces' );
const SimpleQueryResult = require( './SimpleQueryResult' );

const parser = new SparqlParser( { prefixes: allNamespaces } );

module.exports = class SpecificItemPropertyPairQueryHandler {

	canHandle( query ) {
		const parsedQuery = parser.parse( query );
		if ( parsedQuery.queryType !== 'SELECT' || !this.hasSingleTriple( parsedQuery ) ) {
			return false;
		}

		const triple = parsedQuery.where[ 0 ].triples[ 0 ];
		return triple.subject.termType === 'NamedNode' &&
			triple.subject.id.startsWith( namespaceMap.Wikidata.wd ) &&
			triple.predicate.termType === 'NamedNode' &&
			triple.predicate.id.startsWith( namespaceMap.Wikidata.wdt ) &&
			triple.object.termType === 'Variable';
	}

	hasSingleTriple( query ) {
		return query.where &&
			query.where.length === 1 &&
			query.where[ 0 ].triples.length === 1;

	}

	getResult() {
		return new SimpleQueryResult();
	}

};
