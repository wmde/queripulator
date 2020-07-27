'use strict';

const SparqlParser = require( 'sparqljs' ).Parser;
const { allNamespaces } = require( '../lib/rdfNamespaces' );
const SpecificItemPropertyPairQueryHandler = require( '../lib/SpecificItemPropertyPairQueryHandler' );
const SimpleQueryResult = require( '../lib/SimpleQueryResult' );

describe( 'SpecificItemPropertyPairQueryHandler', () => {

	const parser = new SparqlParser( { prefixes: allNamespaces } );

	it( 'can handle queries with a single triple for values of a specific item property pair', () => {
		const query = 'SELECT ?values { wd:Q42 wdt:P31 ?values. }';
		const handler = new SpecificItemPropertyPairQueryHandler();
		expect( handler.canHandle( query, parser.parse( query ) ) ).toBeTruthy();
	} );

	it.each( [
		'ASK { wd:Q42 wdt:P31 wd:Q5. }',
		'SELECT ?item { ?item wdt:P31 wd:Q5. }',
		'SELECT ?values { wd:Q42 wdt:P106 ?values. wd:Q892 wdt:P106 ?values. }',
	] )( 'cannot handle other queries: %s', ( query ) => {
		const handler = new SpecificItemPropertyPairQueryHandler();
		expect( handler.canHandle( query, parser.parse( query ) ) ).toBeFalsy();
	} );

	it( 'is a simple query', () => {
		expect( ( new SpecificItemPropertyPairQueryHandler() ).getResult() )
			.toBeInstanceOf( SimpleQueryResult );
	} );

} );
