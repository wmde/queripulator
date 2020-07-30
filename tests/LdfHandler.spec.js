'use strict';

const parser = require( '../lib/sparqlParser' );
const LdfHandler = require( '../lib/LdfHandler' );
const LdfRequest = require( '../lib/LdfRequest' );

describe( 'LdfHandler', () => {

	const handler = new LdfHandler();

	it.each( [
		'SELECT ?s ?p ?o WHERE { ?s ?p ?o. }',
		'SELECT ?item WHERE { ?item wdt:P31 wd:Q5; wdt:P19 wd:Q4007. }',
	] )( 'handles basic query: %s', ( query ) => {
		expect( handler.handle( query, parser.parse( query ) ) )
			.toBeInstanceOf( LdfRequest );
	} );

	it.each( [
		'SELECT * WHERE { BIND(wd:Q5 AS ?class) ?item wdt:P31 ?class. }',
		`
SELECT ?item ?itemLabel WHERE {
  ?item wdt:P31 wd:Q146.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
		`.replace( /\s+/gm, ' ' ).trim(),
	] )( 'does not handle unsupported query: %s', ( query ) => {
		expect( handler.handle( query, parser.parse( query ) ) )
			.toBeFalsy();
	} );

	it.each( [
		'SELECT DISTINCT ?item WHERE { ?item wd:P1087 []. }',
		'SELECT ?item WHERE { ?item wdt:P31 wd:Q5. } LIMIT 10',
		'SELECT ?item WHERE { ?item wdt:P31 wd:Q146. } OFFSET 0',
		'SELECT * WHERE { ?item wdt:P31 wd:Q5; wdt:P19 wd:Q4007. }',
	] )( 'does not handle query that would trigger ldf-client bug: %s', ( query ) => {
		expect( handler.handle( query, parser.parse( query ) ) )
			.toBeFalsy();
	} );

} );
