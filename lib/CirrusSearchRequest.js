'use strict';

const nodemw = require( './nodemw' );

module.exports = class CirrusSearchRequest {

	constructor( resultColumnName, property, value ) {
		this.resultColumnName = resultColumnName;
		this.property = property;
		this.value = value;
	}

	respond( request, response ) {
		nodemw.getAll(
			{
				action: 'query',
				list: 'search',
				srsearch: `haswbstatement:${this.property}=${this.value}`,
				srnamespace: [
					0, // item
					120, // property
					146, // lexeme
				].join( '|' ),
				srinfo: '',
				srprop: '',
				srlimit: 'max',
			},
			'search',
			( _err, searchResults ) => {
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
		const results = searchHits.map( ( { title } ) => {
			const result = {};
			result[ this.resultColumnName ] = {
				type: 'uri',
				value: 'http://www.wikidata.org/entity/' + title.substring( title.indexOf( ':' ) + 1 ),
			};

			return result;
		} );

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
