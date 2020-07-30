'use strict';

const LabelServiceHandler = require( './LabelServiceHandler' );
const LdfHandler = require( './LdfHandler' );
const OptimizingHandler = require( './OptimizingHandler' );
const QueryHandlerChain = require( './QueryHandlerChain' );
const SubjectByPropertyValueHandler = require( './SubjectByPropertyValueHandler' );
const SubjectByPropertyAnyValueHandler = require( './SubjectByPropertyAnyValueHandler' );
const TruthyHandler = require( './TruthyHandler' );

module.exports = new QueryHandlerChain( [
	new SubjectByPropertyValueHandler(),
	new SubjectByPropertyAnyValueHandler(),
	new LdfHandler(),
	new TruthyHandler(),
	new LabelServiceHandler(),
	new OptimizingHandler(),
] );
