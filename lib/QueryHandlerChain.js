'use strict';

const ComplexQueryResult = require( './ComplexQueryResult' );

module.exports = class QueryHandlerChain {

	constructor( queryHandlers ) {
		this.queryHandlers = queryHandlers;
	}

	getResult( query ) {
		for ( const queryHandler of this.queryHandlers ) {
			if ( queryHandler.canHandle( query ) ) {
				return queryHandler.getResult( query );
			}
		}

		return new ComplexQueryResult();
	}

};
