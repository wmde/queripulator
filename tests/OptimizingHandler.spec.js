'use strict';

const parser = require( '../lib/sparqlParser' );
const OptimizingHandler = require( '../lib/OptimizingHandler' );
const OptimizedWdqsRequest = require( '../lib/OptimizedWdqsRequest' );

describe( 'OptimizingHandler', () => {

	const handler = new OptimizingHandler();

	it.each( [
		'ASK {}',
		'INSERT {} WHERE {}',
		'SELECT * WHERE { ?s ?p ?o. }',
		'SELECT (YEAR(?dob) AS ?yob) WHERE { wd:Q42 wdt:P569 ?dob. }',
		'SELECT ?item WHERE { ?item wdt:P569 ?dob; wdt:P570 ?dod. FILTER(YEAR(?dob) = YEAR(?dod)) }',
		'SELECT ?item WHERE { ?item wdt:P569 ?dob. FILTER(YEAR(?dob) = 10000000000000000) }',
		// the following *could* be optimized, just not by the current implementation
		'SELECT * WHERE { ?item wdt:P569 ?dob. FILTER(YEAR(?dob) > 2020) }',
		'SELECT * WHERE { ?item wdt:P569 ?dob. FILTER(YEAR(?dob) = 2020 && MONTH(?dob) = 7) }',
	] )( 'ignores query it cannot optimize: %s', ( query ) => {
		expect( handler.handle( query, parser.parse( query ) ) ).toBeFalsy();
	} );

	it.each( [
		[
			'SELECT * WHERE { ?item wdt:P569 ?dob. FILTER(YEAR(?dob) = 2020) }',
			'SELECT * WHERE { ?item wdt:P569 ?dob. FILTER((?dob >= "2020-00-00"^^xsd:dateTime) && (?dob < "2021-00-00"^^xsd:dateTime)) }',
		],
		[
			'SELECT * WHERE { ?item wdt:P569 ?dob. FILTER(2020 = YEAR(?dob)) }',
			'SELECT * WHERE { ?item wdt:P569 ?dob. FILTER((?dob >= "2020-00-00"^^xsd:dateTime) && (?dob < "2021-00-00"^^xsd:dateTime)) }',
		],
		[
			'SELECT * WHERE { { ?item wdt:P569 ?dob. FILTER(YEAR(?dob) = 2020) } UNION {} }',
			'SELECT * WHERE { { ?item wdt:P569 ?dob. FILTER((?dob >= "2020-00-00"^^xsd:dateTime) && (?dob < "2021-00-00"^^xsd:dateTime)) } UNION { } }',
		],
		[
			'SELECT * WHERE { OPTIONAL { ?item wdt:P569 ?dob. FILTER(YEAR(?dob) = 2020) } }',
			'SELECT * WHERE { OPTIONAL { ?item wdt:P569 ?dob. FILTER((?dob >= "2020-00-00"^^xsd:dateTime) && (?dob < "2021-00-00"^^xsd:dateTime)) } }',
		],
	] )( 'optimizes %s into %s', ( query, expected ) => {
		const result = handler.handle( query, parser.parse( query ) );
		expect( result ).toBeInstanceOf( OptimizedWdqsRequest );
		expect( result.query.replace( /\s+/g, ' ' ) ).toBe( expected );
	} );

	it( 'does not modify the input parsedQuery', () => {
		const query = 'SELECT * WHERE { ?item wdt:P569 ?dob. FILTER(YEAR(?dob) = 2020) }';
		const parsedQuery = parser.parse( query );

		handler.handle( query, parsedQuery );

		expect( parsedQuery ).toStrictEqual( parser.parse( query ) );
	} );

} );
