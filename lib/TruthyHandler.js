'use strict';

const traverse = require( 'traverse' );

const { namespaceMap } = require( './rdfNamespaces' );
const TruthyWdqsRequest = require( './TruthyWdqsRequest' );

module.exports = class TruthyHandler {

	handle( query, parsedQuery ) {
		if ( !parsedQuery ) {
			return;
		}

		let truthy = true;
		traverse( parsedQuery ).forEach( ( element ) => {
			if ( !truthy ) {
				return;
			}

			if ( element.termType === 'NamedNode' &&
				element.value.startsWith( 'http://www.wikidata.org/' ) &&
				!element.value.startsWith( namespaceMap.Wikidata.wd ) &&
				!element.value.startsWith( namespaceMap.Wikidata.wdt ) &&
				!element.value.startsWith( namespaceMap.Wikidata.wdno )
			) {
				truthy = false;
				return;
			}

			if ( element.predicate !== undefined &&
				element.predicate.termType === 'Variable'
			) {
				truthy = false;
				return;
			}
		} );

		if ( truthy ) {
			return new TruthyWdqsRequest( query );
		}
	}

};
