'use strict';

const SparqlParser = require( 'sparqljs' ).Parser;
const { allNamespaces } = require( '../lib/rdfNamespaces' );
const SpecificItemPropertyPairQueryHandler = require( '../lib/SpecificItemPropertyPairQueryHandler' );
const WdqsRequest = require( '../lib/WdqsRequest' );

describe( 'SpecificItemPropertyPairQueryHandler', () => {

	const parser = new SparqlParser( { prefixes: allNamespaces } );

	it( 'handles queries with a single triple for values of a specific item property pair', () => {
		const query = 'SELECT ?values { wd:Q42 wdt:P31 ?values. }';
		const handler = new SpecificItemPropertyPairQueryHandler();
		const result = handler.handle( query, parser.parse( query ) );
		expect( result ).toBeTruthy();
		expect( result ).toBeInstanceOf( WdqsRequest );
		expect( result.extraResponseHeaders ).toStrictEqual( {
			'X-Simple-Query': 'true',
		} );
	} );

	it.each( [
		'ASK { wd:Q42 wdt:P31 wd:Q5. }',
		'SELECT ?item { ?item wdt:P31 wd:Q5. }',
		'SELECT ?values { wd:Q42 wdt:P106 ?values. wd:Q892 wdt:P106 ?values. }',
	] )( 'cannot handle other queries: %s', ( query ) => {
		const handler = new SpecificItemPropertyPairQueryHandler();
		expect( handler.handle( query, parser.parse( query ) ) ).toBeFalsy();
	} );

} );
