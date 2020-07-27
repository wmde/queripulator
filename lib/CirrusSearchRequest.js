'use strict';

const nodemw = require( './nodemw' );

module.exports = class CirrusSearchRequest {

	constructor( resultColumnName, property, value ) {
		this.resultColumnName = resultColumnName;
		this.property = property;
		this.value = value;
	}

	respond( request, response ) {
		nodemw.search( `haswbstatement:${this.property}=${this.value}`, ( _err, searchResults ) => {
			response.writeHead(
				200,
				{
					'content-type': 'application/sparql-results+json',
				},
			).end( JSON.stringify(
				this.transformToQueryResultFormat( searchResults ),
			) );
		} );
	}

	transformToQueryResultFormat( searchHits ) {
		const results = searchHits.map( ( searchHit ) => {
			const result = {};
			result[ this.resultColumnName ] = {
				type: 'uri',
				value: 'http://www.wikidata.org/entity/' + searchHit.title,
			};

			return result;
		} ) || [];

		return {
			head: {
				vars: [ this.resultColumnName ],
			},
			results: {
				bindings: results,
			},
		};
	}
};
