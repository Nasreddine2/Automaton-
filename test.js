const readline = require("readline");

class RegEx {
  // MACROS
  static CONCAT = 0xc04ca7;
  static ETOILE = 0xe7011e;
  static ALTERN = 0xa17e54;
  static PROTECTION = 0xbaddad;

  static PARENTHESEOUVRANT = 0x16641664;
  static PARENTHESEFERMANT = 0x51515151;
  static DOT = 0xd07;

  // REGEX
  constructor() {
    this.regEx = "";
  }

  // MAIN FUNCTION
  static main(arg) {
    console.log("Welcome to Bogota, Mr. Thomas Anderson.");

    let regEx;
    if (arg && arg.length > 0) {
      regEx = arg[0];
      this.processRegEx(regEx);
    } else {
      // Create interface for input and output
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(">> Please enter a regEx: ", (input) => {
        regEx = input;
        this.processRegEx(regEx);
        rl.close(); // Close the readline interface
      });
    }
  }

  // Processing function to avoid code duplication
  static processRegEx(regEx) {
    console.log(`>> Parsing regEx "${regEx}".`);
    console.log(">> ...");

    if (regEx.length < 1) {
      console.error(">> ERROR: empty regEx.");
    } else {
      console.log(`>> ASCII codes: [${regEx.charCodeAt(0)}`);
      for (let i = 1; i < regEx.length; i++)
        console.log(`,${regEx.charCodeAt(i)}`);
      console.log("].");

      try {
        const ret = RegEx.parse(regEx);
        console.log(`>> Tree result: ${ret.toString()}.`);
      } catch (e) {
        console.error(`>> ERROR: syntax error for regEx "${regEx}".`);
      }
    }

    console.log(">> ...");
    console.log(">> Parsing completed.");
    console.log("Goodbye Mr. Anderson.");
  }

  // FROM REGEX TO SYNTAX TREE
  static parse(regEx) {
    if (false) throw new Error();
    const example = RegEx.exampleAhoUllman();
    if (false) return example;

    let result = [];
    for (let i = 0; i < regEx.length; i++) {
      result.push(new RegExTree(RegEx.charToRoot(regEx.charAt(i)), []));
    }

    return RegEx.parseTrees(result);
  }

  static charToRoot(c) {
    if (c === ".") return RegEx.DOT;
    if (c === "*") return RegEx.ETOILE;
    if (c === "|") return RegEx.ALTERN;
    if (c === "(") return RegEx.PARENTHESEOUVRANT;
    if (c === ")") return RegEx.PARENTHESEFERMANT;
    return c.charCodeAt(0);
  }

  static parseTrees(result) {
    while (RegEx.containParenthese(result))
      result = RegEx.processParenthese(result);
    while (RegEx.containEtoile(result)) result = RegEx.processEtoile(result);
    while (RegEx.containConcat(result)) result = RegEx.processConcat(result);
    while (RegEx.containAltern(result)) result = RegEx.processAltern(result);

    if (result.length > 1) throw new Error();

    return RegEx.removeProtection(result[0]);
  }

  static containParenthese(trees) {
    return trees.some(
      (t) =>
        t.root === RegEx.PARENTHESEFERMANT || t.root === RegEx.PARENTHESEOUVRANT
    );
  }

  static processParenthese(trees) {
    let result = [];
    let found = false;
    for (let t of trees) {
      if (!found && t.root === RegEx.PARENTHESEFERMANT) {
        let done = false;
        let content = [];
        while (!done && result.length > 0) {
          if (result[result.length - 1].root === RegEx.PARENTHESEOUVRANT) {
            done = true;
            result.pop();
          } else {
            content.unshift(result.pop());
          }
        }
        if (!done) throw new Error();
        found = true;
        result.push(
          new RegExTree(RegEx.PROTECTION, [RegEx.parseTrees(content)])
        );
      } else {
        result.push(t);
      }
    }
    if (!found) throw new Error();
    return result;
  }

  static containEtoile(trees) {
    return trees.some(
      (t) => t.root === RegEx.ETOILE && t.subTrees.length === 0
    );
  }

  static processEtoile(trees) {
    let result = [];
    let found = false;
    for (let t of trees) {
      if (!found && t.root === RegEx.ETOILE && t.subTrees.length === 0) {
        if (result.length === 0) throw new Error();
        found = true;
        let last = result.pop();
        result.push(new RegExTree(RegEx.ETOILE, [last]));
      } else {
        result.push(t);
      }
    }
    return result;
  }

  static containConcat(trees) {
    let firstFound = false;
    for (let t of trees) {
      if (!firstFound && t.root !== RegEx.ALTERN) {
        firstFound = true;
        continue;
      }
      if (firstFound && t.root !== RegEx.ALTERN) return true;
      firstFound = false;
    }
    return false;
  }

  static processConcat(trees) {
    let result = [];
    let found = false;
    let firstFound = false;
    for (let t of trees) {
      if (!found && !firstFound && t.root !== RegEx.ALTERN) {
        firstFound = true;
        result.push(t);
        continue;
      }
      if (!found && firstFound && t.root === RegEx.ALTERN) {
        firstFound = false;
        result.push(t);
        continue;
      }
      if (!found && firstFound && t.root !== RegEx.ALTERN) {
        found = true;
        let last = result.pop();
        result.push(new RegExTree(RegEx.CONCAT, [last, t]));
      } else {
        result.push(t);
      }
    }
    return result;
  }

  static containAltern(trees) {
    return trees.some(
      (t) => t.root === RegEx.ALTERN && t.subTrees.length === 0
    );
  }

  static processAltern(trees) {
    let result = [];
    let found = false;
    let left = null;
    let done = false;
    for (let t of trees) {
      if (!found && t.root === RegEx.ALTERN && t.subTrees.length === 0) {
        if (result.length === 0) throw new Error();
        found = true;
        left = result.pop();
        continue;
      }
      if (found && !done) {
        if (!left) throw new Error();
        done = true;
        result.push(new RegExTree(RegEx.ALTERN, [left, t]));
      } else {
        result.push(t);
      }
    }
    return result;
  }

  static removeProtection(tree) {
    if (tree.root === RegEx.PROTECTION && tree.subTrees.length !== 1)
      throw new Error();
    if (tree.subTrees.length === 0) return tree;
    if (tree.root === RegEx.PROTECTION)
      return RegEx.removeProtection(tree.subTrees[0]);

    let subTrees = tree.subTrees.map((t) => RegEx.removeProtection(t));
    return new RegExTree(tree.root, subTrees);
  }

  // EXAMPLE FROM Aho-Ullman
  static exampleAhoUllman() {
    let a = new RegExTree("a".charCodeAt(0), []);
    let b = new RegExTree("b".charCodeAt(0), []);
    let c = new RegExTree("c".charCodeAt(0), []);
    let cEtoile = new RegExTree(RegEx.ETOILE, [c]);
    let dotBCEtoile = new RegExTree(RegEx.CONCAT, [b, cEtoile]);
    return new RegExTree(RegEx.ALTERN, [a, dotBCEtoile]);
  }
}

class RegExTree {
  constructor(root, subTrees) {
    this.root = root;
    this.subTrees = subTrees;
  }

  toString() {
    if (this.subTrees.length === 0) return this.rootToString();
    let result = `${this.rootToString()}(${this.subTrees[0].toString()}`;
    for (let i = 1; i < this.subTrees.length; i++)
      result += `,${this.subTrees[i].toString()}`;
    return result + ")";
  }

  rootToString() {
    if (this.root === RegEx.CONCAT) return ".";
    if (this.root === RegEx.ETOILE) return "*";
    if (this.root === RegEx.ALTERN) return "|";
    if (this.root === RegEx.DOT) return ".";
    return String.fromCharCode(this.root);
  }
}

// Pour lancer la fonction main
RegEx.main(process.argv.slice(2));
