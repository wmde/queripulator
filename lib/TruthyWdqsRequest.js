'use strict';

const WdqsRequest = require( './WdqsRequest' );

module.exports = class TruthyWdqsRequest extends WdqsRequest {

	constructor( query ) {
		super( query, {
			'Queripulator-Request': 'TruthyWdqsRequest',
		} );
	}

};
