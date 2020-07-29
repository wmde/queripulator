'use strict';

const SparqlParser = require( 'sparqljs' ).Parser;
const { allNamespaces } = require( './rdfNamespaces' );

module.exports = new SparqlParser( { prefixes: allNamespaces } );
