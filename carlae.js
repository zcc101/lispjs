'use strict';

const readline = require('readline');

class CarlaeError extends Error {}

class CarlaeSyntaxError extends CarlaeError {}

class CarlaeNameError extends CarlaeError {}

class CarlaeEvaluationError extends CarlaeError {}

class CarlaeEnv {
  constructor(parentEnv = null) {
    this.table = new Map();
    this.parent = parentEnv;
  }

  lookup(name) {
    if (this.table.has(name)) {
      return this.table.get(name);
    }
    let cur = this.parent;
    let val = undefined;
    while (cur) {
      if (cur.table.has(name)) {
        val = cur.table.get(name);
        break;
      }
      cur = cur.parent;
    }
    return val;
  }

  defineName(name, value) {
    this.table.set(name, value);
  }

  static fromMap(map) {
    const env = new CarlaeEnv();
    env.table = map;
    return env;
  }
}

class UserDefinedFunction {
  constructor(params, body, parentEnv) {
    this.params = params;
    this.body = body;
    this.localEnv = new CarlaeEnv(parentEnv);
  }

  passArgs(args) {
    for (let i = 0; i < this.params.length; i++) {
      this.localEnv.defineName(this.params[i], args[i]);
    }
  }
}

const carlaeBuiltins = new Map([
  [
    '+',
    (args) => {
      return args.reduce((prev, cur) => {
        return prev + cur;
      });
    },
  ],
  [
    '-',
    (args) => {
      return args.reduce((prev, cur) => {
        return prev - cur;
      });
    },
  ],
  [
    '*',
    (args) => {
      return args.reduce((prev, cur) => {
        return prev * cur;
      });
    },
  ],
  [
    '/',
    (args) => {
      return args.reduce((prev, cur) => {
        return prev / cur;
      });
    },
  ],
]);

function log(...args) {
  console.log.apply(console, args);
}

function isBlank(s) {
  return /\s+/.test(s);
}

function numberOrSymbol(s) {
  if (/^-?\d+\.?\d*$/.test(s)) {
    return Number(s);
  } else {
    return s;
  }
}

/**
 *
 * @param {string} source
 * @returns {string[]}
 */
function tokenize(source) {
  const tokens = [];
  let word = '',
    // 当前的字符是否属于注释
    inComments = false;

  for (let i = 0; i < source.length; i++) {
    if (inComments) {
      if (source[i] === '\n') {
        inComments = false;
      }
    } else {
      if (source[i] === '#') {
        inComments = true;
        if (word.length) {
          tokens.push(word);
          word = '';
        }
      } else if (source[i] === '(' || source[i] === ')') {
        if (word.length) {
          tokens.push(word);
          word = '';
        }
        tokens.push(source[i]);
      } else if (isBlank(source[i])) {
        if (word.length) {
          tokens.push(word);
          word = '';
        }
      } else {
        word += source[i];
      }
    }
  }

  if (word.length) {
    tokens.push(word);
    word = '';
  }

  return tokens;
}

/**
 * parsing the list of tokens into an abstract syntax tree.
 * A number is represented according to its JavaScript type(Number).
 * A symbol is represented as string.
 * An S-expression is represented as a list of its parsed subexpressions.
 * @param {string[]} tokens
 * @returns {object[]}
 */
function parse(tokens) {
  if (tokens.length === 1 && tokens[0] !== '(') {
    return numberOrSymbol(tokens[0]);
  }

  const parseHelper = (idx) => {
    const token = tokens[idx];
    if (tokens[idx] === '(') {
      let [cur, nextIdx] = parseHelper(idx + 1);
      if (nextIdx < tokens.length) {
        let rest;
        [rest, nextIdx] = parseHelper(nextIdx);
        return [[cur].concat(rest), nextIdx];
      } else {
        return [cur, nextIdx];
      }
    } else if (tokens[idx] === ')') {
      return [[], idx + 1];
    } else {
      let cur = numberOrSymbol(token);
      let [rest, nextIdx] = parseHelper(idx + 1);
      return [[cur].concat(rest), nextIdx];
    }
  };
  const [tree, nextIdx] = parseHelper(0);
  return tree;
}

/**
 *  tree-walking evaluator for carlae
 * @param {array} tree
 * @param {CarlaeEnv} env
 * @returns
 */
function evaluate(tree, env = null) {
  if (!env) {
    env = new CarlaeEnv(CarlaeEnv.fromMap(carlaeBuiltins));
  }

  if (typeof tree === 'number') {
    return tree;
  }

  if (typeof tree === 'string') {
    const val = env.lookup(tree);
    if (!val) {
      throw new CarlaeNameError(`unknown identifier: ${tree}`);
    }
    return val;
  }

  if (tree[0] === 'function') {
    return new UserDefinedFunction(tree[1], tree[2], env);
  }

  if (tree[0] === ':=') {
    if (typeof tree[1] === 'string') {
      const val = evaluate(tree[2]);
      env.defineName(tree[1], val);
      return val;
    }
    const name = tree[1][0];
    const params = tree[1].slice(1);
    const fn = new UserDefinedFunction(params, tree[2], env);
    env.defineName(name, fn);
    return fn;
  }

  const fn = evaluate(tree[0], env);
  const args = [];

  for (let i = 1; i < tree.length; i++) {
    args.push(evaluate(tree[i], env));
  }

  if (typeof f === 'function') {
    return fn(args);
  }

  if (fn instanceof UserDefinedFunction) {
    fn.passArgs(args);
    return evaluate(fn.body, fn.localEnv);
  }

  return fn(args);
}

/**
 * Read-eval-print-loop
 * read line from stdin
 * evaluate code
 * print value
 */
function repl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'carlae> ',
  });

  const globalEnv = new CarlaeEnv(CarlaeEnv.fromMap(carlaeBuiltins));

  rl.prompt();
  rl.on('line', (line) => {
    if (line === 'exit') {
      process.exit(0);
    }
    const tokens = tokenize(line);
    const tree = parse(tokens);

    try {
      const res = evaluate(tree, globalEnv);
      log(res);
    } catch (err) {
      log(err);
    } finally {
      rl.prompt();
    }
  });
}

(() => {
  repl();
})();
