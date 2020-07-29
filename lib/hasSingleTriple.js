'use strict';

module.exports = function hasSingleTriple( query ) {
	return query.where &&
		query.where.length === 1 &&
		query.where[ 0 ].type === 'bgp' &&
		query.where[ 0 ].triples.length === 1;
};
