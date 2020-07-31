'use strict';

const { namespaceMap } = require( './rdfNamespaces' );
const hasSingleTriple = require( './hasSingleTriple' );
const PropertyCirrusSearchRequest = require( './PropertyCirrusSearchRequest' );

module.exports = class SubjectByPropertyAnyValueHandler {
	handle( _query, parsedQuery ) {
		if ( !parsedQuery ||
			parsedQuery.queryType !== 'SELECT' ||
			parsedQuery.variables.length !== 1 ||
			parsedQuery.variables[ 0 ].termType !== 'Variable' ||
			!hasSingleTriple( parsedQuery ) ) {
			return false;
		}
		const triple = parsedQuery.where[ 0 ].triples[ 0 ];
		if ( triple.subject.termType !== 'Variable' ||
			triple.subject.id !== parsedQuery.variables[ 0 ].id ||
			triple.predicate.termType !== 'NamedNode' ||
			!triple.predicate.id.startsWith( namespaceMap.Wikidata.wdt ) ||
			!(
				triple.object.termType === 'BlankNode' ||
				triple.object.termType === 'Variable' &&
				triple.object.id !== parsedQuery.variables[ 0 ].id
			) ) {
			return false;
		}

		return new PropertyCirrusSearchRequest(
			triple.subject.id.substring( 1 ),
			triple.predicate.id.substring( namespaceMap.Wikidata.wdt.length ),
		);
	}
};
