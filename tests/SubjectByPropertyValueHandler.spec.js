'use strict';

const parser = require( '../lib/sparqlParser' );
const SubjectByPropertyValueHandler = require( '../lib/SubjectByPropertyValueHandler' );
const CirrusSearchRequest = require( '../lib/CirrusSearchRequest' );

describe( 'SubjectByPropertyValueHandler', () => {

	it.each( [
		[ 'ASK {}' ],
		[ 'INSERT {} WHERE {}' ],
		[ 'SELECT * WHERE { ?s ?p ?o. }' ],
		[ 'SELECT ?values { wd:Q42 wdt:P31 ?values. }' ],
		[ 'SELECT ?item (NOW() AS ?asOf) WHERE { ?item wdt:P123 "456" }' ],
		[ 'SELECT ?urls WHERE { { wd:Q21980377 p:P856 [wikibase:rank wikibase:PreferredRank; ps:P856 ?urls]. } }' ],
	] )( 'does not handle query: %s', ( query ) => {
		const handler = new SubjectByPropertyValueHandler();
		expect( handler.handle( query, parser.parse( query ) ) ).toBeFalsy();
	} );

	it.each( [
		[ 'SELECT ?item WHERE { ?item wdt:P345 "nm0010930". }' ],
		[ 'SELECT ?item WHERE { ?item wdt:P31 wd:Q5. }' ],
	] )( 'creates a CirrusSearchRequest from query: %s', ( query ) => {
		const handler = new SubjectByPropertyValueHandler();
		expect( handler.handle( query, parser.parse( query ) ) )
			.toBeInstanceOf( CirrusSearchRequest );
	} );

} );
