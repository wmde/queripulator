'use strict';

const fs = require( 'fs' );
const process = require( 'process' );
const readline = require( 'readline' );
const parser = require( './lib/sparqlParser' );
const defaultQueryHandlerChain = require( './lib/defaultQueryHandlerChain' );

function getHandlerMatchingQuery( query, handlers ) {
	let parsedQuery;
	try {
		parsedQuery = parser.parse( query );
	} catch ( _e ) {
		return 'parseError';
	}

	for ( const handler of handlers ) {
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

const rd = readline.createInterface( {
	input: fs.createReadStream( process.argv[ 2 ] ),
	output: process.stdout,
	terminal: false,
} );

const matchCounts = {};
rd.on( 'line', ( line ) => {
	const csvParts = line.split( ',' );
	const query = decodeURIComponent( csvParts[ csvParts.length - 1 ].replace( /\+/g, '%20' ) );
	const handlerForQuery = getHandlerMatchingQuery( query, defaultQueryHandlerChain.queryHandlers );

	matchCounts[ handlerForQuery ] = ( matchCounts[ handlerForQuery ] || 0 ) + 1;
} );

rd.on( 'close', () => {
	console.log( matchCounts );
} );
