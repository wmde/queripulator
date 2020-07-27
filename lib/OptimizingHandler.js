'use strict';

const SparqlGenerator = require( 'sparqljs' ).Generator;
const { allPrefixes } = require( './rdfNamespaces' );
const WdqsRequest = require( './WdqsRequest' );

module.exports = class OptimizingHandler {

	constructor() {
		this.generator = new SparqlGenerator( { prefixes: allPrefixes } );
	}

	handle( query, parsedQuery ) {
		if ( !parsedQuery ||
			parsedQuery.queryType !== 'SELECT'
		) {
			return;
		}

		let hasChange = false;
		const newQuery = {
			...parsedQuery,
			where: parsedQuery.where.map( ( element ) => {
				if ( element.type !== 'filter' ||
					element.expression.type !== 'operation' ||
					element.expression.operator !== '=' ||
					element.expression.args.length !== 2
				) {
					return element;
				}
				let [ lhs, rhs ] = element.expression.args;
				if ( lhs.type !== 'operation' ) {
					// try swapping them
					[ lhs, rhs ] = [ rhs, lhs ];
				}
				if ( lhs.type !== 'operation' ||
					lhs.operator !== 'year' ||
					lhs.args.length !== 1 ||
					lhs.args[ 0 ].termType !== 'Variable' ||
					rhs.termType !== 'Literal' ||
					rhs.datatype.value !== 'http://www.w3.org/2001/XMLSchema#integer'
				) {
					return element;
				}

				let year;
				try {
					year = parseInt( rhs.value );
				} catch ( e ) {
					return element;
				}
				if ( year.toString() !== rhs.value ) {
					// precision issues or garbage at end of input
					return element;
				}

				// we actually have an expression of the form FILTER(YEAR(?date) = 2020)
				// rewrite it to FILTER(?date >= "2020-00-00"^^xsd:dateTime && ?date < "2021-00-00"^^xsd:dateTime)
				hasChange = true;
				const variable = lhs.args[ 0 ];
				const dateTime = {
					termType: 'NamedNode',
					value: 'http://www.w3.org/2001/XMLSchema#dateTime',
				};
				return {
					type: 'filter',
					expression: {
						type: 'operation',
						operator: '&&',
						args: [
							{
								type: 'operation',
								operator: '>=',
								args: [
									variable,
									{
										termType: 'Literal',
										value: `${year}-00-00`,
										language: '',
										datatype: dateTime,
									},
								],
							},
							{
								type: 'operation',
								operator: '<',
								args: [
									variable,
									{
										termType: 'Literal',
										value: `${year + 1}-00-00`,
										language: '',
										datatype: dateTime,
									},
								],
							},
						],
					},
				};
			} ),
		};

		if ( hasChange ) {
			return new WdqsRequest( this.generator.stringify( newQuery ) );
		}
	}

};
