const readline = require('readline');
const { resultAndEnv } = require('./evaluator');
const { parse, tokenize } = require('./parser');
const { log } = require('./utils');
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

  let env = null;
  rl.prompt();
  rl.on('line', (line) => {
    if (line === 'exit') {
      process.exit(0);
    }
    const tokens = tokenize(line);
    const tree = parse(tokens);

    try {
      let res;
      [res, env] = resultAndEnv(tree, env);
      log(res);
      // log(env);
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
