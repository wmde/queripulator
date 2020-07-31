'use strict';

const CirrusSearchRequest = require( './CirrusSearchRequest' );

module.exports = class PropertyCirrusSearchRequest extends CirrusSearchRequest {
	getCirrusSearchString() {
		return `haswbstatement:${this.property}`;
	}
};
