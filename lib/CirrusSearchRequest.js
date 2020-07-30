'use strict';

const nodemw = require( './nodemw' );

module.exports = class CirrusSearchRequest {

	constructor( resultColumnName, property, value = null ) {
		this.resultColumnName = resultColumnName;
		this.property = property;
		this.value = value;
	}

	respond( request, response ) {
		const search = this.getCirrusSearchString();
		nodemw.getAll(
			{
				action: 'query',
				list: 'search',
				srsearch: search,
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
						'Queripulator-Request': 'CirrusSearchRequest',
						'Queripulator-Search': search,
					},
				).end( JSON.stringify(
					this.transformToQueryResultFormat( searchResults ),
				) );
			} );
	}

	getCirrusSearchString() {
		if ( this.value !== null ) {
			return `haswbstatement:${this.property}=${this.value}`;
		}

		return `haswbstatement:${this.property}`;
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
