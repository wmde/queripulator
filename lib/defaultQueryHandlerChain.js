'use strict';

const LabelServiceHandler = require( './LabelServiceHandler' );
const OptimizingHandler = require( './OptimizingHandler' );
const QueryHandlerChain = require( './QueryHandlerChain' );
const SpecificItemPropertyPairQueryHandler = require( './SpecificItemPropertyPairQueryHandler' );
const SubjectByPropertyValueHandler = require( './SubjectByPropertyValueHandler' );
const TruthyHandler = require( './TruthyHandler' );

module.exports = new QueryHandlerChain( [
	new SpecificItemPropertyPairQueryHandler(),
	new SubjectByPropertyValueHandler(),
	new TruthyHandler(),
	new LabelServiceHandler(),
	new OptimizingHandler(),
] );
