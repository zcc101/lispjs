class CarlaeError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'CarlaeError';
  }
}

class CarlaeSyntaxError extends CarlaeError {
  constructor(msg) {
    super(msg);
    this.name = 'CarlaeSyntaxError';
  }
}

class CarlaeNameError extends CarlaeError {
  constructor(msg) {
    super(msg);
    this.name = 'CarlaeNameError';
  }
}

class CarlaeEvaluationError extends CarlaeError {
  constructor(msg) {
    super(msg);
    this.name = 'CarlaeEvaluationError';
  }
}

// representation of evaluation environment

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

// representation of user-defined function

class UserDefinedFunction {
  constructor(params, body, encloseEnv) {
    this.params = params;
    this.body = body;
    this.encloseEnv = encloseEnv; // the environment in which the function was defined
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

const carlaeBuiltinsEnv = CarlaeEnv.fromMap(carlaeBuiltins);

module.exports = {
  CarlaeError,
  CarlaeEvaluationError,
  CarlaeNameError,
  CarlaeSyntaxError,
  CarlaeEnv,
  UserDefinedFunction,
  carlaeBuiltinsEnv,
};
