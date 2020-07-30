'use strict';

const SparqlGenerator = require( 'sparqljs' ).Generator;
const traverse = require( 'traverse' );
const EntitytermsRequest = require( './EntitytermsRequest' );
const WbgetentitiesRequest = require( './WbgetentitiesRequest' );

module.exports = class LabelServiceHandler {

	handle( query, parsedQuery ) {
		if ( !parsedQuery ||
			parsedQuery.queryType !== 'SELECT'
		) {
			return;
		}

		// find label service in top-level WHERE
		let labelServiceIndex = null;
		for ( let i = 0; i < parsedQuery.where.length; i++ ) {
			const element = parsedQuery.where[ i ];
			if ( element.type !== 'service' ||
				element.name.termType !== 'NamedNode' ||
				element.name.value !== 'http://wikiba.se/ontology#label'
			) {
				continue;
			}
			if ( labelServiceIndex === null ) {
				labelServiceIndex = i;
			} else {
				// two label services, abort
				return;
			}
		}
		if ( labelServiceIndex === null ) {
			return;
		}

		if ( labelServiceIndex + 1 < parsedQuery.where.length &&
			parsedQuery.where[ labelServiceIndex + 1 ].type === 'bgp' &&
			parsedQuery.where[ labelServiceIndex + 1 ].triples[ 0 ].subject.termType === 'NamedNode' &&
			parsedQuery.where[ labelServiceIndex + 1 ].triples[ 0 ].subject.value === 'http://www.bigdata.com/queryHints#Prior' &&
			parsedQuery.where[ labelServiceIndex + 1 ].triples[ 0 ].predicate.termType === 'NamedNode' &&
			parsedQuery.where[ labelServiceIndex + 1 ].triples[ 0 ].predicate.value === 'http://www.bigdata.com/queryHints#runLast' &&
			parsedQuery.where[ labelServiceIndex + 1 ].triples[ 0 ].object.termType === 'Literal' &&
			parsedQuery.where[ labelServiceIndex + 1 ].triples[ 0 ].object.value === 'false' &&
			parsedQuery.where[ labelServiceIndex + 1 ].triples[ 0 ].object.datatype.value === 'http://www.w3.org/2001/XMLSchema#boolean'
		) {
			// label service is followed by `hint:Prior hint:runLast false`
			// and may therefore influence the rest of the query, abort
			return;
		}

		const labelServiceElement = parsedQuery.where[ labelServiceIndex ];
		if ( labelServiceElement.patterns.length !== 1 ||
			labelServiceElement.patterns[ 0 ].type !== 'bgp' ||
			labelServiceElement.patterns[ 0 ].triples.length !== 1
		) {
			return;
		}

		const labelServiceArguments = labelServiceElement.patterns[ 0 ].triples[ 0 ];
		if ( labelServiceArguments.subject.termType !== 'NamedNode' ||
			labelServiceArguments.subject.value !== 'http://www.bigdata.com/rdf#serviceParam' ||
			labelServiceArguments.predicate.termType !== 'NamedNode' ||
			labelServiceArguments.predicate.value !== 'http://wikiba.se/ontology#language' ||
			labelServiceArguments.object.termType !== 'Literal' ||
			labelServiceArguments.object.language !== '' ||
			labelServiceArguments.object.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string'
		) {
			return;
		}

		const languages = labelServiceArguments.object.value.split( ',' );
		let requestFactory;
		if ( languages.length === 1 ||
			// "en,en" is the result of "[AUTO_LANGUAGE],en" when the user language is English
			languages.length === 2 && languages[ 0 ] === languages[ 1 ]
		) {
			// user wants terms in exactly one language, get those from entityterms
			requestFactory = function ( newQueryString, variableMappings ) {
				return new EntitytermsRequest( newQueryString, variableMappings, languages[ 0 ] );
			};
		} else if ( languages.length === 2 && languages[ 1 ] === 'en' ) {
			// user wants terms in a preferred language falling back to English,
			// get those from wbgetentities
			requestFactory = function ( newQueryString, variableMappings ) {
				return new WbgetentitiesRequest( newQueryString, variableMappings, languages[ 0 ] );
			};
		} else {
			// there’s no API that could conveniently provide other languages
			return;
		}

		const termVariables = parsedQuery.variables
			.filter( ( element ) => element.termType === 'Variable' )
			.map( ( element ) => element.value )
			// note: *AltLabel matches *Label, so we don’t test it explicitly
			.filter( ( name ) => /(Label|Description)$/.test( name ) );

		if ( parsedQuery.having ) {
			const havingVariables = traverse.nodes( parsedQuery.having )
				.filter( ( node ) => node.termType === 'Variable' )
				.map( ( node ) => node.value );
			if ( termVariables.some( Array.prototype.includes, havingVariables ) ) {
				// a term variable is used somewhere in a HAVING() condition
				return;
			}
		}

		const allVariableNames = new Set(
			parsedQuery.variables
				// element is { expression, variable } (x AS ?y) or variable
				.map( ( element ) => element.variable || element )
				.map( ( variable ) => variable.value ),
		);
		const variableMappings = {};
		outer: for ( const termVariable of termVariables ) {
			for ( const [ suffix, termType ] of [
				[ 'AltLabel', 'alias' ],
				[ 'Label', 'label' ],
				[ 'Description', 'description' ],
			] ) {
				if ( !termVariable.endsWith( suffix ) ) {
					continue;
				}
				const baseVariable = termVariable.substring( 0, termVariable.length - suffix.length );
				if ( allVariableNames.has( baseVariable ) ) {
					variableMappings[ baseVariable ] = {
						...variableMappings[ baseVariable ],
						[ termVariable ]: termType,
					};
					continue outer;
				} else {
					// no mapping for this variable (`SELECT ?yLabel` without any ?y);
					// not really a problem, just ignore it
				}
			}
		}
		// past this point, use Object.keys( variableMappings ) instead of termVariables
		termVariables.length = 0;

		const newQueryWhere = parsedQuery.where.slice(); // shallow copy
		newQueryWhere.splice( labelServiceIndex, 1 ); // splice out label service
		const newQuery = {
			...parsedQuery,
			where: newQueryWhere,
			// we could remove the term variables from the .variables and .group,
			// but it’s not strictly necessary so KISS and don’t do it for now :)
		};

		const newQueryString = new SparqlGenerator().stringify( newQuery );
		return requestFactory( newQueryString, variableMappings );
	}

};
