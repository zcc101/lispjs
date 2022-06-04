const {
  CarlaeEnv,
  CarlaeEvaluationError,
  CarlaeNameError,
  CarlaeSyntaxError,
  carlaeBuiltinsEnv,
  UserDefinedFunction,
} = require('./carlae');

const specialForm = new Map([
  ['def', evalDefineForm],
  ['fun', evalFunForm],
  ['if', evalIfForm],
]);

function checkSpecialForm(tree) {
  return specialForm.has(tree);
}

function checkSymbol(tree) {
  return typeof tree === 'string' && !specialForm.has(tree);
}

function checkBoolean(tree) {
  return tree === '@t' || tree === '@f';
}

function checkNumber(tree) {
  return typeof tree === 'number';
}

function evalNumber(tree) {
  return tree;
}

function evalBoolean(tree) {
  return tree === '@t';
}

function evalSpecialForm(tree, env) {
  return specialForm.get(tree[0])(tree, env);
}

function evalSymbol(tree, env) {
  const val = env.lookup(tree);
  if (!val) {
    throw new CarlaeNameError(`unknown identifier: ${tree}`);
  }
  return val;
}

function evalDefineForm(tree, env) {
  // define function
  if (Array.isArray(tree[1])) {
    const name = tree[1][0];
    const params = tree[1].slice(1);
    const fn = new UserDefinedFunction(params, tree[2], env);
    env.defineName(name, fn);
    return fn;
  }

  // def variable
  const val = evaluate(tree[2], env);
  env.defineName(tree[1], val);
  return val;
}

function evalFunForm(tree, env) {
  return new UserDefinedFunction(tree[1], tree[2], env);
}

function evalIfForm(tree, env) {
  const cond = evaluate(tree[1], env);
  if (cond) {
    return evaluate(tree[2], env);
  } else {
    return evaluate(tree[3], env);
  }
}

function evalFunctionCall(tree, env) {
  const fn = evaluate(tree[0], env);
  const args = [];

  for (let i = 1; i < tree.length; i++) {
    args.push(evaluate(tree[i], env));
  }

  // builtin function call
  if (typeof fn === 'function') {
    return fn(args);
  }

  // user-defined function call
  if (fn instanceof UserDefinedFunction) {
    const newEnv = new CarlaeEnv(fn.encloseEnv);
    for (let i = 0; i < fn.params.length; i++) {
      newEnv.defineName(fn.params[i], args[i]);
    }
    return evaluate(fn.body, newEnv);
  }
}

/**
 *  tree-walking evaluator for carlae
 * @param {array} tree
 * @param {CarlaeEnv} env
 * @returns
 */
function evaluate(tree, env) {
  if (checkNumber(tree)) {
    return evalNumber(tree);
  }

  if (checkBoolean(tree)) {
    return evalBoolean(tree);
  }

  if (checkSymbol(tree)) {
    return evalSymbol(tree, env);
  }

  // (if ...) (def ...) (fun ...)
  if (checkSpecialForm(tree[0])) {
    return evalSpecialForm(tree, env);
  }

  // function call
  return evalFunctionCall(tree, env);
}

function resultAndEnv(tree, env = null) {
  if (!env) {
    env = new CarlaeEnv(carlaeBuiltinsEnv);
  }
  return [evaluate(tree, env), env];
}

function stringify(sexp) {
  if (typeof sexp === 'number') {
    return String(sexp);
  }
  if (typeof sexp === 'boolean') {
    if (sexp) {
      return '@t';
    } else {
      return '@f';
    }
  }

  if (typeof sexp === 'function') {
    return 'builtin function';
  }

  if (sexp instanceof UserDefinedFunction) {
    return 'function object';
  }
}

module.exports = {
  resultAndEnv,
  stringify,
};
