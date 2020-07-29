'use strict';

const parser = require( '../lib/sparqlParser' );
const hasSingleTriple = require( '../lib/hasSingleTriple' );

describe( 'hasSingleTriple', () => {

	it.each( [
		[ 'ASK { ?x ?y ?z }' ],
		[ 'SELECT * WHERE { ?s ?p ?o. }' ],
		[ 'SELECT ?values { wd:Q42 wdt:P31 ?values. }' ],
		[ 'SELECT ?item WHERE { ?item wdt:P345 "nm0010930". }' ],
		[ 'SELECT ?item (NOW() AS ?asOf) WHERE { ?item wdt:P123 "456" }' ],
	] )( 'returns true for queries that consist of a single triple: %s', ( query ) => {
		expect( hasSingleTriple( parser.parse( query ) ) ).toBeTruthy();
	} );

	it.each( [
		[ 'ASK {}' ],
		[ 'INSERT {} WHERE {}' ],
		[ 'SELECT ?urls WHERE { { wd:Q21980377 p:P856 [wikibase:rank wikibase:PreferredRank; ps:P856 ?urls]. } }' ],
	] )( 'returns false for queries that do not only consist of a single triple: %s', ( query ) => {
		expect( hasSingleTriple( parser.parse( query ) ) ).toBeFalsy();
	} );

} );
