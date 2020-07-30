'use strict';

const {
	FragmentsClient,
	SparqlIterator,
	SparqlResultWriter,
} = require( 'ldf-client' );

module.exports = class LdfRequest {

	constructor( query ) {
		this.query = query;
	}

	respond( request, response ) {
		response.writeHead(
			200,
			{
				'content-type': 'application/sparql-results+json',
				'Queripulator-Request': 'LdfRequest',
			},
		);
		const iterator = new SparqlIterator(
			// do NOT use a parsedQuery here – SparqlIterator *can* take a parsed query,
			// but uses a completely different version of SPARQL.js than us
			// and therefore expects the parsed query to look very differently
			this.query,
			{
				fragmentsClient: new FragmentsClient( 'https://query.wikidata.org/bigdata/ldf' ),
			},
		);
		const writer = SparqlResultWriter.instantiate( 'application/sparql-results+json', iterator );
		writer.on( 'data', ( chunk ) => response.write( chunk ) );
		writer.on( 'end', () => response.end() );
		writer.on( 'error', console.error );
	}

};
