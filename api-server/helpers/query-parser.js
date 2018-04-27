const opPrecedence = {
	'not': 0,
	'and': 1,
	'or':  2
};

function isOperator (str) {
	const normStr = normalizeOperator(str);
	return ['not', 'and', 'or'].includes(normStr);
}

function normalizeOperator (str) {
	return str.toLowerCase();
}

class QueryNode {
	constructor (type, data) {
		this.type = type;
		this.data = data;
	}
}

class Query {
	constructor () {
		this.root = null;
	}

	parse (str) {
		// Reset the root
		this.root = null;

		// Tokenize the input string
		// TODO: condense spaces
		const strParts = str.split(' ');

		// Create the stacks needed for the shunting yard algo
		const nodeStack = [];
		const opStack = [];

		// This function will pop the top operator, along with the needed nodes,
		// and push the new combined node onto the node stack
		function processTopOp () {
			const op = opStack.pop();
			let newNode;

			if (op == 'not') {
				const node = nodeStack.pop();
				if (!node) {
					throw new Error(`unexpected '${op}'`);
				}
				newNode = new QueryNode(op, { node });

			} else if (op == 'and' || op == 'or') {
				const right = nodeStack.pop();
				const left = nodeStack.pop();
				if (!right || !left) {
					throw new Error(`unexpected '${op}'`);
				}
				newNode = new QueryNode(op, { right, left });

			} else {
				throw new Error(`unrecognized '${op}'`);
			}

			nodeStack.push(newNode);
		}

		// Parse the tokenized input
		for (const part of strParts) {
			if (isOperator(part)) {
				const op = normalizeOperator(part);

				while (opStack.length > 0) {
					const topOp = opStack.slice(-1)[0];
					const opP1 = opPrecedence[topOp];
					const opP2 = opPrecedence[op];
					if (opP1 <= opP2) {
						processTopOp();
					} else {
						break;
					}
				}

				opStack.push(op);

			} else {
				nodeStack.push(new QueryNode('tag', {
					value: part,
				}));
			}
		}

		// To finish parsing, we have to pop off any remaining operators
		while (opStack.length > 0) {
			processTopOp();
		}

		// We should only have one combined node left
		if (nodeStack.length > 1) {
			throw new Error('too many terms left; too few ops given');
		}

		// The remaining node is our new root
		this.root = nodeStack.pop() || null;
	}

	toFilterClause (tagVarName) {
		let str = '';
		let params = {};

		const randomPrefix = Math.random().toString(36).substr(2, 5);
		let currentSuffix = 0;

		function convertNode (node) {
			if (node.type === 'tag') {
				const name = randomPrefix + (currentSuffix++).toString();
				params[name] = node.data.value;
				return `@${name} IN ${tagVarName}`;
			}
			if (node.type === 'not') {
				node = node.data.node;
				const name = randomPrefix + (currentSuffix++).toString();
				params[name] = node.data.value;
				return `@${name} NOT IN ${tagVarName}`;
			}
			if (node.type === 'and') {
				const left = convertNode(node.data.left);
				const right = convertNode(node.data.right);
				return `${left} AND ${right}`;
			}
			if (node.type === 'or') {
				const left = convertNode(node.data.left);
				const right = convertNode(node.data.right);
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
	const q = new Query();
	q.parse(str);
	return q;
}

module.exports = { parse };
