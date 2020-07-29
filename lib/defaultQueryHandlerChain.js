const OptimizingHandler = require( './OptimizingHandler' );
const QueryHandlerChain = require( './QueryHandlerChain' );
const SpecificItemPropertyPairQueryHandler = require( './SpecificItemPropertyPairQueryHandler' );
const SubjectByPropertyValueHandler = require( './SubjectByPropertyValueHandler' );

module.exports = new QueryHandlerChain( [
	new SpecificItemPropertyPairQueryHandler(),
	new OptimizingHandler(),
	new SubjectByPropertyValueHandler(),
] );
