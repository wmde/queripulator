'use strict';

const Bot = require( 'nodemw' );

module.exports = new Bot( {
	protocol: 'https',
	server: 'wikidata.org',
	path: '/w',
	debug: false,
} );
