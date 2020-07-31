'use strict';

const parser = require( '../lib/sparqlParser' );
const TruthyHandler = require( '../lib/TruthyHandler' );
const TruthyWdqsRequest = require( '../lib/TruthyWdqsRequest' );

describe( 'TruthyHandler', () => {

	const handler = new TruthyHandler();

	it.each( [
		'SELECT * WHERE { ?item wdt:P31 wd:Q5; wdt:P19 wd:Q146. }',
		'SELECT * WHERE { ?item wdt:P31 wd:Q5; a wdno:P570. }',
		`
SELECT ?item ?itemLabel WHERE {
  ?item wdt:P31 wd:Q146.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
		`.replace( /\s+/gm, ' ' ).trim(),
	] )( 'detects query as truthy: %s', ( query ) => {
		expect( handler.handle( query, parser.parse( query ) ) )
			.toBeInstanceOf( TruthyWdqsRequest );
	} );

	it.each( [
		'SELECT * WHERE { ?item p:P31/ps:P31 wd:Q486972. }',
		'SELECT * WHERE { ?item p:P39 [ ps:P39 wd:Q11696; pq:P2715 wd:Q45578 ]. }',
		'SELECT (COUNT(*) AS ?c) WHERE { ?property wikibase:claim ?p. ?item ?p ?statement. }',
		'SELECT * WHERE { ?item ?p [ ?ps wd:Q109411 ]. }',
		'SELECT * WHERE { { OPTIONAL { ?item p:P31/ps:P31 wd:Q486972. } } UNION {} }',
	] )( 'rejects query as not truthy: %s', ( query ) => {
		expect( handler.handle( query, parser.parse( query ) ) )
			.toBeFalsy();
	} );

} );
