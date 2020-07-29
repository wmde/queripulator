'use strict';

const { namespaceMap } = require( './rdfNamespaces' );
const CirrusSearchRequest = require( './CirrusSearchRequest' );

module.exports = class SubjectByPropertyValueHandler {

	handle( _query, parsedQuery ) {
		if ( !parsedQuery ||
			parsedQuery.queryType !== 'SELECT' ||
			parsedQuery.variables.length !== 1 ||
			parsedQuery.variables[ 0 ].termType !== 'Variable' ||
			!this.hasSingleTriple( parsedQuery ) ) {
			return false;
		}

		const triple = parsedQuery.where[ 0 ].triples[ 0 ];
		if ( triple.subject.termType !== 'Variable' ||
			triple.subject.id !== parsedQuery.variables[ 0 ].id ||
			triple.predicate.termType !== 'NamedNode' ||
			!triple.predicate.id.startsWith( namespaceMap.Wikidata.wdt ) ) {
			return false;
		}

		let value;
		if ( triple.object.termType === 'Literal' && /^"\w+"$/.test( triple.object.id ) ) {
			value = triple.object.id.substring( 1, triple.object.id.length - 1 );
		} else if ( triple.object.termType === 'NamedNode' &&
			triple.object.id.startsWith( namespaceMap.Wikidata.wd ) ) {
			value = triple.object.id.substring( namespaceMap.Wikidata.wd.length );
		} else {
			return false;
		}

		return new CirrusSearchRequest(
			triple.subject.id.substring( 1 ),
			triple.predicate.id.substring( namespaceMap.Wikidata.wdt.length ),
			value,
		);
	}

	hasSingleTriple( query ) {
		return query.where &&
			query.where.length === 1 &&
			query.where[ 0 ].type === 'bgp' &&
			query.where[ 0 ].triples.length === 1;
	}

};
