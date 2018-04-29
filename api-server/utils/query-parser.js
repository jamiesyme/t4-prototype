const QueryParseError = require('../errors/query-parse-error');

class QueryParser {
	constructor () {
		this.notPrec = 1;
		this.andPrec = 2;
		this.orPrec = 3;
	}
	
	parse (str) {
		this.str = str;
		this.strIndex = 0;

		// Parse the query
		const query = new Query();
		query.root = this.acceptQuery();

		// If there is more of the string that hasn't been parsed, then the
		// string either has two tags or two operators side-by-side.
		if (this.hasMoreParts()) {
			const part = this.peekNextPart();
			let msg;
			if (part === 'not' ||
				part === 'and' ||
				part === 'or') {
				msg = 'expected a tag';
			} else {
				msg = 'expected an operator';
			}
			throw new QueryParseError(msg, this.str, this.strIndex);
		}

		return query;
	}

	expectQuery (maxPrec = 100) {
		const node = this.acceptQuery(maxPrec);
		if (!node) {
			const msg = 'expected a tag';
			throw new QueryParseError(msg, this.str, this.strIndex);
		}
		return node;
	}

	acceptQuery (maxPrec = 100) {
		let node;

		// These next few checks are ordered by operator precedence - changing
		// the precendence values w/o adjusting the order of the following checks
		// will potentially cause problems.

		// Check for: [NOT] tag
		const notNode = maxPrec >= this.notPrec ? this.acceptNot() : null;
		const tagNode = this.acceptTag();
		if (!tagNode) {
			return null;
		} else if (notNode) {
			node = notNode;
			node.child = tagNode;
		} else {
			node = tagNode;
		}

		// Check for: [AND ...]
		const andNode = maxPrec >= this.andPrec ? this.acceptAnd() : null;
		if (andNode) {
			const tmp = node;
			node = andNode;
			node.leftChild = tmp;
			node.rightChild = this.expectQuery(Math.min(maxPrec, this.andPrec));
		}

		// Check for: [OR ...]
		const orNode = maxPrec >= this.orPrec ? this.acceptOr() : null;
		if (orNode) {
			const tmp = node;
			node = orNode;
			node.leftChild = tmp;
			node.rightChild = this.expectQuery(Math.min(maxPrec, this.orPrec));
		}

		return node;
	}

	acceptAnd () {
		if (this.peekNextPart() === 'and') {
			this.popNextPart();
			return new QueryNode('and');
		}
	}

	acceptOr () {
		if (this.peekNextPart() === 'or') {
			this.popNextPart();
			return new QueryNode('or');
		}
	}

	acceptNot () {
		if (this.peekNextPart() === 'not') {
			this.popNextPart();
			return new QueryNode('not');
		}
	}

	acceptTag () {
		const part = this.peekNextPart();
		if (part &&
			part !== 'not' &&
			part !== 'and' &&
			part !== 'or') {
			this.popNextPart();

			const node = new QueryNode('tag');
			node.tag = part;
			return node;
		}
	}

	hasMoreParts () {
		return !!this.peekNextPart();
	}

	peekNextPart () {
		// To avoid implementing all of the same logic as popNextPart(), we'll
		// just use that and then revert the string index
		const oldStrIndex = this.strIndex;
		const nextPart = this.popNextPart();
		this.strIndex = oldStrIndex;
		return nextPart;
	}

	popNextPart () {
		// Skip initial whitespace
		while (this.str[this.strIndex] === ' ') {
			this.strIndex++;
		}

		// We may be out of parts
		if (this.strIndex >= this.str.length) {
			return null;
		}

		// Check for operators by symbol
		let opSymbol = this.str.substr(this.strIndex, 2);
		const notRegex = /^!/;
		const andRegex = /^&&/;
		const orRegex = /^\|\|/;
		if (notRegex.test(opSymbol)) {
			this.strIndex += 1;
			return 'not';
		}
		if (andRegex.test(opSymbol)) {
			this.strIndex += 2;
			return 'and';
		}
		if (orRegex.test(opSymbol)) {
			this.strIndex += 2;
			return 'or';
		}

		// Collect the next part manually checking each character
		const startIndex = this.strIndex;
		while (this.strIndex < this.str.length) {

			// Spaces separate parts
			if (this.str[this.strIndex] === ' ') {
				break;
			}

			// Operator symbols separate parts
			let opSymbol = this.str.substr(this.strIndex, 2);
			if (notRegex.test(opSymbol) ||
				andRegex.test(opSymbol) ||
				orRegex.test(opSymbol)) {
				break;
			}

			this.strIndex++;
		}
		const endIndex = this.strIndex;
		const part = this.str.substring(startIndex, endIndex);

		// Skip additonal whitespace - this will improve the strIndex accuracy
		// for error messages
		while (this.str[this.strIndex] === ' ') {
			this.strIndex++;
		}

		// The part we collected may be an operator in word form
		if (/^not$/i.test(part)) {
			return 'not';
		}
		if (/^and$/i.test(part)) {
			return 'and';
		}
		if (/^or$/i.test(part)) {
			return 'or';
		}

		return part;
	}
}

class QueryNode {
	constructor (type) {
		this.type = type;
	}
}

class Query {
	constructor () {
		this.root = null;
	}

	toFilterClause (tagVarName) {
		let str = '';
		let params = {};

		const randomPrefix = Math.random().toString(36).substr(2, 5);
		let currentSuffix = 0;

		function convertNode (node) {
			if (node.type === 'tag') {
				const name = randomPrefix + (currentSuffix++).toString();
				params[name] = node.tag;
				return `@${name} IN ${tagVarName}`;
			}
			if (node.type === 'not') {
				node = node.child;
				const name = randomPrefix + (currentSuffix++).toString();
				params[name] = node.tag;
				return `@${name} NOT IN ${tagVarName}`;
			}
			if (node.type === 'and') {
				const left = convertNode(node.leftChild);
				const right = convertNode(node.rightChild);
				return `${left} AND ${right}`;
			}
			if (node.type === 'or') {
				const left = convertNode(node.leftChild);
				const right = convertNode(node.rightChild);
				return `${left} OR ${right}`;
			}
			throw new Error(`unknown op '${node.type}'`);
		}
		str = `FILTER ${convertNode(this.root)}`;

		return {
			filter: str,
			params: params,
		};
	}
}

function parse (str) {
	const qp = new QueryParser();
	return qp.parse(str);
}

module.exports = { parse };
