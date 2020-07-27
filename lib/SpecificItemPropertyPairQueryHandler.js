'use strict';

const { namespaceMap } = require( './rdfNamespaces' );
const SimpleQueryResult = require( './SimpleQueryResult' );

module.exports = class SpecificItemPropertyPairQueryHandler {

	canHandle( query, parsedQuery ) {
		if ( !parsedQuery || parsedQuery.queryType !== 'SELECT' || !this.hasSingleTriple( parsedQuery ) ) {
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
