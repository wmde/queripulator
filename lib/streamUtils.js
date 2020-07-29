'use strict';

const { Map: ImmutableMap } = require( 'immutable' );
const { Transform } = require( 'stream' );

/**
 * Transform stream that combines chunks into groups of a certain size.
 * Input is individual objects, output is arrays of those objects.
 * (The final group may be smaller than the group size
 * if the input size is not a multiple of the group size.)
 */
class GroupingTransform extends Transform {
	/**
	 * @param {Object} options
	 * @param {number} options.groupSize
	 */
	constructor( options ) {
		super( { ...options, objectMode: true } );
		this.groupSize = options.groupSize || 1;
		this.chunks = [];
	}

	_transform( chunk, _encoding, callback ) {
		this.chunks.push( chunk );
		if ( this.chunks.length >= this.groupSize ) {
			// eslint-disable-next-line no-underscore-dangle
			this._flush( callback );
		} else {
			callback();
		}
	}

	_flush( callback ) {
		let group;
		while ( ( group = this.chunks.splice( 0, this.groupSize ) ).length ) {
			this.push( group );
		}
		callback();
	}
}

/**
 * Transform stream that flattens groups into individual objects.
 * Input is arrays of objects, output is individual objects.
 * Can be used to undo {@link GroupingTransform}.
 */
class UngroupingTransform extends Transform {
	constructor( options ) {
		super( { ...options, objectMode: true } );
	}

	_transform( chunk, _encoding, callback ) {
		for ( const datum of chunk ) {
			this.push( datum );
		}
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

module.exports = {
	ActorBindingsTransform,
	GroupingTransform,
	UngroupingTransform,
};
