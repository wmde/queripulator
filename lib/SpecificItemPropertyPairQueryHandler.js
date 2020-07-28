'use strict';

const { namespaceMap } = require( './rdfNamespaces' );
const WdqsRequest = require( './WdqsRequest' );

module.exports = class SpecificItemPropertyPairQueryHandler {

	handle( query, parsedQuery ) {
		if ( !parsedQuery ||
			parsedQuery.queryType !== 'SELECT' ||
			!this.hasSingleTriple( parsedQuery )
		) {
			return false;
		}

		const triple = parsedQuery.where[ 0 ].triples[ 0 ];
		if ( triple.subject.termType !== 'NamedNode' ||
			!triple.subject.id.startsWith( namespaceMap.Wikidata.wd ) ||
			triple.predicate.termType !== 'NamedNode' ||
			!triple.predicate.id.startsWith( namespaceMap.Wikidata.wdt ) ||
			triple.object.termType !== 'Variable'
		) {
			return false;
		}

		return new WdqsRequest( query, { 'X-Simple-Query': 'true' } );
	}

	hasSingleTriple( query ) {
		return query.where &&
			query.where.length === 1 &&
			query.where[ 0 ].type === 'bgp' &&
			query.where[ 0 ].triples.length === 1;

	}

};
