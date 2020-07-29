'use strict';

const axios = require( 'axios' );
const { ActorSparqlSerializeSparqlJson } = require( '@comunica/actor-sparql-serialize-sparql-json' );
const { Bus } = require( '@comunica/core' );
const { Map: ImmutableMap } = require( 'immutable' );
const { literal } = require( '@rdfjs/data-model' );
const { SparqlJsonParser } = require( 'sparqljson-parse' );
const { Transform } = require( 'stream' );

const nodemw = require( './nodemw' );
const { namespaceMap } = require( './rdfNamespaces' );
const { GroupingTransform, UngroupingTransform } = require( './streamUtils' );

/**
 * Transform stream that adds term variables to SPARQL results,
 * based on the given variable mappings.
 * Expects input to be grouped in chunks of at most 50 bindings,
 * so you’ll usually want to pipe this between a {GroupingTransform} and an {UngroupingTransform}.
 */
class EntitytermsTransform extends Transform {
	/**
	 * @param {Object} options
	 * @param {Object.<string, Object.<string, string>>} options.variableMappings
	 * Mappings from base variable names (?x) to derived variable names (?xLabel)
	 * and term types (label). Example: { x: { xLabel: 'label' } }
	 * @param {string} options.language The language in which to get the terms.
	 * No language fallbacks are supported. (Labels fall back to the entity ID.)
	 */
	constructor( options ) {
		super( { ...options, objectMode: true } );
		this.variableMappings = options.variableMappings;
		this.language = options.language;
	}

	async _transform( chunk, encoding, callback ) {
		for ( const [ baseVariable, mappings ] of Object.entries( this.variableMappings ) ) {
			await new Promise( ( resolve, reject ) => {
				const titles = chunk.map( ( bindings ) => bindings[ baseVariable ] )
					.filter( ( node ) => node && node.value && node.value.indexOf( namespaceMap.Wikidata.wd ) === 0 )
					.map( ( node ) => node.value.substring( namespaceMap.Wikidata.wd.length ) )
					.map( ( entityId ) => {
						switch ( entityId[ 0 ] ) {
							case 'Q':
								return entityId;
							case 'P':
								return `Property:${entityId}`;
							case 'L':
								return `Lexeme:${entityId}`;
							default:
								return '';
						}
					} );
				nodemw.getAll(
					{
						action: 'query',
						titles: titles.join( '|' ),
						prop: 'entityterms',
						wbetterms: Object.values( mappings ).join( '|' ),
						uselang: this.language,
						formatversion: 2,
					},
					'pages',
					( err, pages ) => {
						if ( err ) {
							reject( err );
							return;
						}
						for ( const page of pages ) {
							const entityId = page.title.substring( page.title.indexOf( ':' ) + 1 );
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
								let terms = page.entityterms && page.entityterms[ termType ];
								if ( !terms ) {
									if ( termType === 'label' ) {
										terms = [ page.title.substring( page.title.indexOf( ':' ) + 1 ) ];
									} else {
										terms = [];
									}
								}
								bindings[ termVariable ] = literal( terms.join( ', ' ), this.language );
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

/**
 * Transform stream that prepares SPARQL results for a Comunica actor.
 * Input is bindings objects as produced by sparqljson-parse,
 * output is an ImmutableMap with keys prefixed by ? as expected by Comunica.
 */
class ActorBindingsTransform extends Transform {
	constructor( options ) {
		super( { ...options, objectMode: true } );
	}

	_transform( chunk, encoding, callback ) {
		callback( null, ImmutableMap( chunk )
			.mapKeys( ( variable ) => `?${variable}` ) );
	}
}

module.exports = class EntitytermsRequest {

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
					.pipe( new EntitytermsTransform( { language: this.language, variableMappings: this.variableMappings } ) )
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
