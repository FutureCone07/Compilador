// 1. TOKENIZER
function tokenize(input) {
  
  const tokenSpec = [
    ['NEWLINE', /^\r?\n/],
    ['SPACE', /^[ ]+/],
    ['NUMBER', /^\d+(\.\d+)?/],
    ['ASSIGN', /^[=:]/],
    // Palabras reservadas
    ['FUNCTION', /^function\b/],
    ['IF', /^if\b/],
    ['ELSE', /^else\b/],
    ['RETURN', /^return\b/],
    ['WHILE', /^while\b/],
    ['FOR', /^for\b/],
    // Símbolos
    ['PAREN_OPEN', /^\(/],
    ['PAREN_CLOSE', /^\)/],
    ['BRACE_OPEN', /^\{/],
    ['BRACE_CLOSE', /^\}/],
    ['COMMA', /^,/],
    ['SEMICOLON', /^;/],
    // Operadores
    ['OP', /^[+\-*/%]/],
    // Variables
    ['VARIABLE', /^[a-zA-Z_][a-zA-Z0-9_]*/],
    ['DOT', /^\./],
    ['MISMATCH', /^./]
  ];

  const tokens = [];
  let current = 0;

  while (current < input.length) {
    let match = null;

    for (const [type, regex, skip] of tokenSpec) {
      match = regex.exec(input.slice(current));
      if (match) {
        if (!skip) {
          tokens.push({ type, value: match[0] });
        }
        current += match[0].length;
        break;
      }
    }

    if (!match) throw new Error(`Unexpected token: "${input[current]}"`);
  }

  return tokens;
}

// 2. PARSER
function parse(tokens) {
  let current = 0;

  function walk() {
    let token = tokens[current];
    if (!token) throw new Error('Final inesperado de entrada');

    while (token && (token.type === 'SPACE' || token.type === 'NEWLINE')) {
    current++;
    token = tokens[current];
  }

    // Manejo de números
    if (token.type === 'NUMBER') {
      current++;
      return { type: 'NumberLiteral', value: token.value };
    }

    // Manejo de paréntesis
    if (token.type === 'PAREN_OPEN') {
      current++;
      const expression = walk();

      token = tokens[current];
      if (!token || token.type !== 'PAREN_CLOSE') {
        throw new Error('Paréntesis de cierre esperado');
      }
      current++;

      return {
        type: 'ParenthesizedExpression',
        expression
      };
    }

    // Manejo de palabras reservadas
    if (token.type === 'IF') {
  current++;
  
  if (tokens[current].type !== 'PAREN_OPEN') {
    throw new Error('Esperado ( después de if');
  }
  current++;
  const test = walk(); // condición

  if (tokens[current].type !== 'PAREN_CLOSE') {
    throw new Error('Esperado ) antes if condición');
  }
  current++;

  if (tokens[current].type !== 'BRACE_OPEN') {
    throw new Error('Esperado { antes if condición');
  }
  current++;
  const consequent = [];

  while (tokens[current].type !== 'BRACE_CLOSE') {
    consequent.push(walk());
  }
  current++;

  let alternate = null;
  if (tokens[current] && tokens[current].type === 'ELSE') {
    current++;

    if (tokens[current].type === 'IF') {
      alternate = walk(); // else if
    } else if (tokens[current].type === 'BRACE_OPEN') {
      current++;
      alternate = [];

      while (tokens[current].type !== 'BRACE_CLOSE') {
        alternate.push(walk());
      }
      current++;
    } else {
      throw new Error('Expected { or if after else');
    }
  }

  return {
    type: 'If Statement',
    test,
    consequent,
    alternate
  };
}
if (token.type === 'WHILE') {
  current++;

  if (tokens[current].type !== 'PAREN_OPEN') {
    throw new Error('Expected ( after while');
  }
  current++;
  const test = walk(); // condición

  if (tokens[current].type !== 'PAREN_CLOSE') {
    throw new Error('Expected ) after while condition');
  }
  current++;

  if (tokens[current].type !== 'BRACE_OPEN') {
    throw new Error('Expected { after while');
  }
  current++;

  const body = [];
  while (tokens[current].type !== 'BRACE_CLOSE') {
    body.push(walk());
  }
  current++;

  return {
    type: 'WhileStatement',
    test,
    body
  };
}
  



    // Manejo de variables
    if (token.type === 'VARIABLE') {
      const name = token.value;
      current++;

      // Asignación
      if (tokens[current] && tokens[current].type === 'ASSIGN') {
        current++;
        const value = walk();
        return {
          type: 'AssignmentExpression',
          name,
          value
        };
      }

      // Llamada a función
      if (tokens[current] && tokens[current].type === 'PAREN_OPEN') {
        current++;
        const args = [];
        while (tokens[current].type !== 'PAREN_CLOSE') {
          args.push(walk());
          if (tokens[current].type === 'COMMA') current++;
        }
        current++;
        return {
          type: 'CallExpression',
          name,
          arguments: args
        };
      }

      return { type: 'Variable', name };
    }

    // Operadores
    if (token.type === 'OP') {
      const operator = token.value;
      current++;

      const left = walk();
      const right = walk();

      return {
        type: 'BinaryExpression',
        operator,
        left,
        right
      };
    }

    throw new Error(`Unknown token at position ${current}: ${token.value}`);
  }

  const body = [];
  while (current < tokens.length) {
    body.push(walk());
  }

  return {
    type: 'Program',
    body
  };
}

// 3. CONVERT AST TO TREE STRUCTURE
function convertASTToTree(astNode) {
  if (typeof astNode !== 'object' || astNode === null) {
    return { name: String(astNode) };
  }

  const node = {
    name: astNode.type || "Node",
    children: []
  };

  for (let key in astNode) {
    if (key === 'type') continue;

    const value = astNode[key];

    if (Array.isArray(value)) {
      value.forEach(child => {
        node.children.push(convertASTToTree(child));
      });
    } else if (typeof value === 'object') {
      node.children.push({
        name: key,
        children: [convertASTToTree(value)]
      });
    } else {
      node.children.push({ name: `${key}: ${value}` });
    }
  }

  return node;
}

// 4. RENDER AST TREE WITH D3
function renderASTDiagram(ast) {
  document.getElementById("ast-diagram").innerHTML = "";

  const data = convertASTToTree(ast);
  const width = document.getElementById("ast-diagram").clientWidth;
  const height = 600;

  const svg = d3.select("#ast-diagram")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g").attr("transform", "translate(50, 50)");

  const treeLayout = d3.tree().size([width - 100, height - 100]);
  const root = d3.hierarchy(data);
  treeLayout(root);

  g.selectAll("line")
    .data(root.links())
    .join("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", "#ccc");

  g.selectAll("circle")
    .data(root.descendants())
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 20)
    .attr("fill", "#007bff");

  g.selectAll("text")
    .data(root.descendants())
    .join("text")
    .attr("x", d => d.x)
    .attr("y", d => d.y)
    .attr("dy", 5)
    .attr("text-anchor", "middle")
    .text(d => d.data.name)
    .attr("fill", "black")
    .style("font-size", "12px");
}

// 5. RUN COMPILER
function runCompiler() {
  const input = document.getElementById('code-input').value;

  try {
    const tokens = tokenize(input);
    const ast = parse(tokens);

    // Mostrar tokens en formato <"token", "tipo">
    const formattedTokens = tokens.map(token => `<"${token.value}", "${token.type}">`).join('\n');
    document.getElementById('tokens-output').textContent = formattedTokens;

    // AST en JSON
    document.getElementById('ast-output').textContent = JSON.stringify(ast, null, 2);

    // Visualización del árbol sintáctico
    renderASTDiagram(ast);

  } catch (error) {
    document.getElementById('tokens-output').textContent = '';
    document.getElementById('ast-output').textContent = `Error: ${error.message}`;
    document.getElementById("ast-diagram").innerHTML = '';
  }
}