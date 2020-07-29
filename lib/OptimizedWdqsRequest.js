'use strict';

const WdqsRequest = require( './WdqsRequest' );

module.exports = class OptimizedWdqsRequest extends WdqsRequest {

	constructor( query, originalQuery ) {
		super( query, {
			'Queripulator-Original-Query': originalQuery,
			'Queripulator-Optimized-Query': query,
		} );
	}

};
