'use strict';

const axios = require( 'axios' );
const { ActorSparqlSerializeSparqlJson } = require( '@comunica/actor-sparql-serialize-sparql-json' );
const { Bus } = require( '@comunica/core' );
const { SparqlJsonParser } = require( 'sparqljson-parse' );
const { Transform } = require( 'stream' );

const {
	ActorBindingsTransform,
	GroupingTransform,
	UngroupingTransform,
} = require( './streamUtils' );

/**
 * Abstract base class for request classes that send a query to WDQS
 * and then augment the result using API requests.
 */
module.exports = class WdqsPlusApiRequest {

	/**
	 * @param {string} query The SPARQL query to send to WDQS.
	 * @param {Transform} transform Stream to modify the returned bindings.
	 * Called with groups (arrays) of up to fifty bindings objects at once.
	 */
	constructor( query, transform ) {
		this.query = query;
		this.transform = transform;
		this.sparqlJsonParser = new SparqlJsonParser();
	}

	respond( request, response ) {
		const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent( this.query );
		const headers = {
			accept: 'application/sparql-results+json',
			'user-agent': `${request.headers[ 'user-agent' ]} Queripulator/1.0.0`,
		};
		axios.get( url, { headers, responseType: 'stream' } ).then(
			async ( wdqsResponse ) => {
				const actor = new ActorSparqlSerializeSparqlJson( {
					bus: new Bus(),
				} );
				const action = { type: 'bindings' };
				let haveVariables;
				const haveVariablesPromise = new Promise( ( resolve ) => {
					haveVariables = resolve;
				} );
				action.bindingsStream = this.sparqlJsonParser.parseJsonResultsStream( wdqsResponse.data )
					.on( 'variables', ( variables ) => {
						action.variables = variables.map( ( { value } ) => `?${value}` );
						haveVariables();
					} )
					.pipe( new GroupingTransform( { groupSize: 50 } ) )
					.pipe( this.transform )
					.pipe( new UngroupingTransform() )
					.pipe( new ActorBindingsTransform() );
				await haveVariablesPromise;
				const { data } = await actor.runHandle( action );
				response.writeHead(
					200,
					{
						'content-type': 'application/sparql-results+json',
					},
				);
				data.pipe( response );
			},
			( _wdqsError ) => {
				response.writeHead( 500 );
				response.end();
			},
		);
	}

};
