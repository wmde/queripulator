'use strict';

const CirrusSearchRequest = require( './CirrusSearchRequest' );

module.exports = class PropertyValueCirrusSearchRequest extends CirrusSearchRequest {
	getCirrusSearchString() {
		return `haswbstatement:${this.property}=${this.value}`;
	}
};
