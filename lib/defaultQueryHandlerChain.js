'use strict';

const LabelServiceHandler = require( './LabelServiceHandler' );
const OptimizingHandler = require( './OptimizingHandler' );
const QueryHandlerChain = require( './QueryHandlerChain' );
const SubjectByPropertyValueHandler = require( './SubjectByPropertyValueHandler' );
const TruthyHandler = require( './TruthyHandler' );

module.exports = new QueryHandlerChain( [
	new SubjectByPropertyValueHandler(),
	new TruthyHandler(),
	new LabelServiceHandler(),
	new OptimizingHandler(),
] );
