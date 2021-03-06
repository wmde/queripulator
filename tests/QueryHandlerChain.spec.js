'use strict';

const QueryHandlerChain = require( '../lib/QueryHandlerChain' );
const WdqsRequest = require( '../lib/WdqsRequest' );

describe( 'QueryHandlerChain', () => {

	const SOME_QUERY = 'ASK { wd:Q42 wdt:P31 wd:Q5. }';

	it( 'falls back to complex query by default', () => {
		const handler = new QueryHandlerChain( [] );
		const result = handler.getResult( SOME_QUERY );
		expect( result ).toBeInstanceOf( WdqsRequest );
		expect( result.extraResponseHeaders ).toStrictEqual( {} );
	} );

	it( 'delegates to a matching handler if possible', () => {
		const expectedResult = { type: 'custom' };
		const stubHandler = {
			handle: () => expectedResult,
		};
		const handler = new QueryHandlerChain( [ stubHandler ] );

		expect( handler.getResult( SOME_QUERY ) ).toBe( expectedResult );
	} );

	it( 'catches errors from broken handlers', () => {
		const expectedResult = { type: 'custom' };
		const badHandler = {
			handle() {
				throw new Error();
			},
		};
		const goodHandler = {
			handle() {
				return expectedResult;
			},
		};
		jest.spyOn( console, 'error' ).mockImplementation( /* don’t call spied method */ );
		const handler = new QueryHandlerChain( [ badHandler, goodHandler ] );

		expect( handler.getResult( SOME_QUERY ) ).toBe( expectedResult );
		expect( console.error ).toHaveBeenCalled();
	} );

} );
