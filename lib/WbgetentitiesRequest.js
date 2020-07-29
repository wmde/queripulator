'use strict';

const axios = require( 'axios' );
const { ActorSparqlSerializeSparqlJson } = require( '@comunica/actor-sparql-serialize-sparql-json' );
const { Bus } = require( '@comunica/core' );
const { literal } = require( '@rdfjs/data-model' );
const { SparqlJsonParser } = require( 'sparqljson-parse' );
const { Transform } = require( 'stream' );

const nodemw = require( './nodemw' );
const { namespaceMap } = require( './rdfNamespaces' );
const {
	ActorBindingsTransform,
	GroupingTransform,
	UngroupingTransform,
} = require( './streamUtils' );

function termTypePlural( termType ) {
	return termType === 'alias' ? 'aliases' : `${termType}s`;
}

/**
 * Transform stream that adds term variables to SPARQL results,
 * based on the given variable mappings.
 * Expects input to be grouped in chunks of at most 50 bindings,
 * so you’ll usually want to pipe this between a {GroupingTransform} and an {UngroupingTransform}.
 */
class WbgetentitiesTransform extends Transform {
	/**
	 * @param {Object} options
	 * @param {Object.<string, Object.<string, string>>} options.variableMappings
	 * Mappings from base variable names (?x) to derived variable names (?xLabel)
	 * and term types (label). Example: { x: { xLabel: 'label' } }
	 * @param {string} options.language The language in which to get the terms.
	 * Language fallbacks are applied by the API. (Labels fall back to the entity ID.)
	 */
	constructor( options ) {
		super( { ...options, objectMode: true } );
		this.variableMappings = options.variableMappings;
		this.language = options.language;
	}

	async _transform( chunk, encoding, callback ) {
		for ( const [ baseVariable, mappings ] of Object.entries( this.variableMappings ) ) {
			await new Promise( ( resolve, reject ) => {
				const entityIds = chunk.map( ( bindings ) => bindings[ baseVariable ] )
					.filter( ( node ) => node && node.value && node.value.indexOf( namespaceMap.Wikidata.wd ) === 0 )
					.map( ( node ) => node.value.substring( namespaceMap.Wikidata.wd.length ) );
				nodemw.api.call(
					{
						action: 'wbgetentities',
						ids: entityIds.join( '|' ),
						props: Object.values( mappings ).map( termTypePlural ).join( '|' ),
						languages: this.language,
						languagefallback: 1,
						formatversion: 2,
					},
					( err, _info, _next, response ) => {
						if ( err ) {
							reject( err );
							return;
						}
						for ( const [ entityId, entity ] of Object.entries( response.entities ) ) {
							const bindings = chunk.find( ( bindings ) => {
								const node = bindings[ baseVariable ];
								if ( !node || !node.value || node.value.indexOf( namespaceMap.Wikidata.wd ) !== 0 ) {
									return false;
								}
								return node.value.substring( namespaceMap.Wikidata.wd.length ) === entityId;
							} );
							if ( !bindings ) {
								continue;
							}
							for ( const [ termVariable, termType ] of Object.entries( mappings ) ) {
								const key = termTypePlural( termType );
								let terms = entity[ key ] && entity[ key ][ this.language ];
								if ( terms ) {
									if ( !Array.isArray( terms ) ) {
										terms = [ terms ];
									}
									const termsString = terms.map( ( term ) => term.value ).join( ', ' );
									bindings[ termVariable ] = literal( termsString, terms[ 0 ].language );
								} else if ( termType === 'label' ) {
									bindings[ termVariable ] = literal( entityId );
								}
							}
						}
						resolve();
					},
				);
			} );
		}
		this.push( chunk );
		callback();
	}
}

module.exports = class WbgetentitiesRequest {

	constructor( query, variableMappings, language ) {
		this.query = query;
		this.variableMappings = variableMappings;
		this.language = language;
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
					.pipe( new WbgetentitiesTransform( { language: this.language, variableMappings: this.variableMappings } ) )
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
