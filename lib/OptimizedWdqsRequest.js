'use strict';

const WdqsRequest = require( './WdqsRequest' );

module.exports = class OptimizedWdqsRequest extends WdqsRequest {

	constructor( query ) {
		super( query, {
			'Queripulator-Request': 'OptimizedWdqsRequest',
			'Queripulator-Optimized-Query': query,
		} );
	}

};
