'use strict';

const QueryHandlerChain = require( '../lib/QueryHandlerChain' );
const ComplexQueryResult = require( '../lib/ComplexQueryResult' );
const SimpleQueryResult = require( '../lib/SimpleQueryResult' );

describe( 'QueryHandlerChain', () => {

	const SOME_QUERY = 'ASK { wd:Q42 wdt:P31 wd:Q5. }';

	it( 'falls back to complex query by default', () => {
		const handler = new QueryHandlerChain( [] );
		expect( handler.getResult( SOME_QUERY ) ).toBeInstanceOf( ComplexQueryResult );
	} );

	it( 'delegates to a matching handler if possible', () => {
		const expectedResult = new SimpleQueryResult();
		const stubHandler = {
			canHandle: () => true,
			getResult: () => expectedResult,
		};
		const handler = new QueryHandlerChain( [ stubHandler ] );

		expect( handler.getResult( SOME_QUERY ) ).toBe( expectedResult );
	} );

} );
