'use strict';

const fs = require( 'fs' );
const process = require( 'process' );
const readline = require( 'readline' );
const parser = require( './lib/sparqlParser' );
const defaultQueryHandlerChain = require( './lib/defaultQueryHandlerChain' );

function getResultForQuery( query, handlers ) {
	let parsedQuery;
	try {
		parsedQuery = parser.parse( query );
	} catch ( _e ) {
		return 'parseError';
	}

	for ( const handler of handlers ) {
		try {
			const request = handler.handle( query, parsedQuery );
			if ( request ) {
				return request.constructor.name;
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
const handlers = defaultQueryHandlerChain.queryHandlers;
const resultStats = {};

rd.on( 'line', ( line ) => {
	const [ count_, averageTime_, encodedQuery ] = line.split( ',' );
	if ( count_ === 'count' ) {
		return; // header line
	}
	const count = parseInt( count_ );
	const averageTime = parseFloat( averageTime_ );
	const query = decodeURIComponent( encodedQuery.replace( /\+/g, '%20' ) );
	const resultForQuery = getResultForQuery( query, handlers );

	if ( !( resultForQuery in resultStats ) ) {
		resultStats[ resultForQuery ] = { distinct: 0, count: 0, time: 0 };
	}
	resultStats[ resultForQuery ].distinct++;
	resultStats[ resultForQuery ].count += count;
	resultStats[ resultForQuery ].time += count * averageTime;
} );

rd.on( 'close', () => {
	const total = Object.values( resultStats )
		.reduce( ( acc, stats ) => {
			acc.distinct += stats.distinct;
			acc.count += stats.count;
			acc.time += stats.time;
			return acc;
		}, { distinct: 0, count: 0, time: 0 } );
	resultStats.total = total;
	console.log( resultStats );
} );
