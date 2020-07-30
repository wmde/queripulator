'use strict';

const parser = require( '../lib/sparqlParser' );
const SubjectByPropertyAnyValueHandler = require( '../lib/SubjectByPropertyAnyValueHandler' );
const CirrusSearchRequest = require( '../lib/CirrusSearchRequest' );

describe( 'SubjectByPropertyAnyValueHandler', () => {

	it.each( [
		[ 'ASK {}' ],
		[ 'INSERT {} WHERE {}' ],
		[ 'SELECT * WHERE { ?s ?p ?o. }' ],
		[ 'SELECT ?item WHERE { ?item wdt:P31 wd:Q5. }' ],
		[ 'SELECT ?item (NOW() AS ?asOf) WHERE { ?item wdt:P123 [] }' ],
		[ 'SELECT ?item ?value WHERE { ?item wdt:P345 ?value. }' ],
		[ 'SELECT ?item WHERE { ?item wdt:P345 ?item. }' ],
	] )( 'does not handle query: %s', ( query ) => {
		const handler = new SubjectByPropertyAnyValueHandler();
		expect( handler.handle( query, parser.parse( query ) ) ).toBeFalsy();
	} );

	it.each( [
		[ 'SELECT ?item WHERE { ?item wdt:P345 [] }' ],
		[ 'SELECT ?item WHERE { ?item wdt:P345 _:b. }' ],
		[ 'SELECT ?item WHERE { ?item wdt:P345 ?notSelected. }' ],
	] )( 'creates a CirrusSearchRequest from query: %s', ( query ) => {
		const handler = new SubjectByPropertyAnyValueHandler();
		expect( handler.handle( query, parser.parse( query ) ) )
			.toBeInstanceOf( CirrusSearchRequest );
	} );

} );
