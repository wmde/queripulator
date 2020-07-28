'use strict';

const LabelServiceHandler = require( './LabelServiceHandler' );
const OptimizingHandler = require( './OptimizingHandler' );
const QueryHandlerChain = require( './QueryHandlerChain' );
const SpecificItemPropertyPairQueryHandler = require( './SpecificItemPropertyPairQueryHandler' );
const SubjectByPropertyValueHandler = require( './SubjectByPropertyValueHandler' );

module.exports = new QueryHandlerChain( [
	new SpecificItemPropertyPairQueryHandler(),
	new LabelServiceHandler(),
	new OptimizingHandler(),
	new SubjectByPropertyValueHandler(),
] );
