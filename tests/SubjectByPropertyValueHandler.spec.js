'use strict';

const SparqlParser = require( 'sparqljs' ).Parser;
const { allNamespaces } = require( '../lib/rdfNamespaces' );
const SubjectByPropertyValueHandler = require( '../lib/SubjectByPropertyValueHandler' );
const CirrusSearchRequest = require( '../lib/CirrusSearchRequest' );

describe( 'SubjectByPropertyValueHandler', () => {

	const parser = new SparqlParser( { prefixes: allNamespaces } );

	it.each( [
		[ 'ASK {}' ],
		[ 'INSERT {} WHERE {}' ],
		[ 'SELECT * WHERE { ?s ?p ?o. }' ],
		[ 'SELECT ?values { wd:Q42 wdt:P31 ?values. }' ],
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
