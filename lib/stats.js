'use strict';

const { Writable } = require( 'stream' );

const counters = {};

/**
 * Increment the counter with the given name by one.
 *
 * @param {string} name
 */
function incrementCounter( name ) {
	counters[ name ] = ( counters[ name ] || 0 ) + 1;
}

/**
 * Dump the statistics to the given stream as a single line of JSON.
 *
 * @param {Writable} stream
 */
function dump( stream ) {
	stream.write( JSON.stringify( { counters } ) + '\n' );
}

module.exports = {
	incrementCounter,
	dump,
};
