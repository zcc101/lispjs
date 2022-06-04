const {
  CarlaeEnv,
  CarlaeEvaluationError,
  CarlaeNameError,
  CarlaeSyntaxError,
  carlaeBuiltinsEnv,
  UserDefinedFunction,
} = require('./carlae');

/**
 *  tree-walking evaluator for carlae
 * @param {array} tree
 * @param {CarlaeEnv} env
 * @returns
 */
function evaluate(tree, env) {
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

  // make a user-defined function
  if (tree[0] === 'fun') {
    return new UserDefinedFunction(tree[1], tree[2], env);
  }

  // define form
  if (tree[0] === 'def') {
    // define variable
    if (typeof tree[1] === 'string') {
      const val = evaluate(tree[2], env);
      env.defineName(tree[1], val);
      return val;
    }

    // define function
    const name = tree[1][0];
    const params = tree[1].slice(1);
    const fn = new UserDefinedFunction(params, tree[2], env);
    env.defineName(name, fn);
    return fn;
  }

  // function call
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

function resultAndEnv(tree, env = null) {
  if (!env) {
    env = new CarlaeEnv(carlaeBuiltinsEnv);
  }
  return [evaluate(tree, env), env];
}

module.exports = {
  resultAndEnv,
};
