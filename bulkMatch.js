'use strict';

const fs = require( 'fs' );
const process = require( 'process' );
const readline = require( 'readline' );
const parser = require( './lib/sparqlParser' );
const OptimizingHandler = require( './lib/OptimizingHandler' );
const SubjectByPropertyValueHandler = require( './lib/SubjectByPropertyValueHandler' );
const SpecificItemPropertyPairQueryHandler = require( './lib/SpecificItemPropertyPairQueryHandler' );

function getHandlerMatchingQuery( query, handlers ) {
	for ( const handler of handlers ) {
		let parsedQuery;
		try {
			parsedQuery = parser.parse( query );
		} catch ( _e ) {
			return 'parseError';
		}

		try {
			if ( handler.handle( query, parsedQuery ) ) {
				return handler.constructor.name;
			}
		} catch ( _e ) {
			return 'handlerError';
		}
	}

	return 'default';
}

const handlers = [
	new SpecificItemPropertyPairQueryHandler(),
	new OptimizingHandler(),
	new SubjectByPropertyValueHandler(),
];

const rd = readline.createInterface( {
	input: fs.createReadStream( process.argv[ 2 ] ),
	output: process.stdout,
	terminal: false,
} );

const matchCounts = {};
rd.on( 'line', ( line ) => {
	const csvParts = line.split( ',' );
	const query = decodeURIComponent( csvParts[ csvParts.length - 1 ].replace( /\+/g, '%20' ) );
	const handlerForQuery = getHandlerMatchingQuery( query, handlers );

	matchCounts[ handlerForQuery ] = ( matchCounts[ handlerForQuery ] || 0 ) + 1;
} );

rd.on( 'close', () => {
	console.log( matchCounts );
} );
