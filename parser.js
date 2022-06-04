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

module.exports = {
  tokenize,
  parse,
};
