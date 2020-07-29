'use strict';

const traverse = require( 'traverse' );

const WdqsRequest = require( './WdqsRequest' );

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

			if ( element.type === 'service' &&
				element.name.termType === 'NamedNode' &&
				element.name.value === 'http://wikiba.se/ontology#label'
			) {
				truthy = false;
				return;
			}

			if ( element.termType === 'NamedNode' &&
				element.value.startsWith( 'http://www.wikidata.org/' ) &&
				!element.value.startsWith( 'http://www.wikidata.org/entity/' ) &&
				!element.value.startsWith( 'http://www.wikidata.org/prop/direct/' ) &&
				!element.value.startsWith( 'http://www.wikidata.org/prop/novalue/' )
			) {
				truthy = false;
				return;
			}
		} );

		if ( truthy ) {
			return new WdqsRequest( query, {
				'X-Truthy-Query': 'true',
			} );
		}
	}

};
