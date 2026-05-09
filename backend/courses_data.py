"""Seed data for programming courses in Portuguese."""

COURSES = [
    {
        "slug": "python",
        "title": "Python",
        "subtitle": "Do zero ao avançado",
        "description": "Aprenda Python, a linguagem mais popular para iniciantes, ciência de dados e IA.",
        "icon": "🐍",
        "color": "#3776AB",
        "level": "Iniciante",
        "lessons": [
            {
                "id": "py-1",
                "title": "Olá, Python!",
                "theory": "# Olá, Python!\n\nPython é uma linguagem de programação **fácil de ler** e poderosa.\n\nPara mostrar um texto na tela, usamos a função `print()`:\n\n```python\nprint('Olá, mundo!')\n```\n\nO texto entre aspas é chamado de **string**.\n\nVocê pode usar aspas simples `'` ou duplas `\"`.",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual função usamos para mostrar texto na tela em Python?",
                    "options": ["show()", "print()", "display()", "echo()"],
                    "correct": 1,
                    "explanation": "A função print() é usada para exibir texto e valores no Python."
                }
            },
            {
                "id": "py-2",
                "title": "Variáveis e Tipos",
                "theory": "# Variáveis\n\nVariáveis guardam valores. Em Python, basta atribuir com `=`:\n\n```python\nnome = 'Ana'\nidade = 25\naltura = 1.65\n```\n\nTipos básicos:\n- **str** (texto): `'Olá'`\n- **int** (inteiro): `42`\n- **float** (decimal): `3.14`\n- **bool** (booleano): `True` ou `False`",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual o tipo do valor 3.14 em Python?",
                    "options": ["int", "str", "float", "bool"],
                    "correct": 2,
                    "explanation": "Números com casas decimais são do tipo float."
                }
            },
            {
                "id": "py-3",
                "title": "Condicionais if/else",
                "theory": "# Condicionais\n\nUsamos `if`, `elif` e `else` para tomar decisões:\n\n```python\nidade = 18\n\nif idade >= 18:\n    print('Maior de idade')\nelse:\n    print('Menor de idade')\n```\n\nA **identação** (espaços no início) é obrigatória em Python!",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "O que será impresso se idade = 15?\n\n```python\nif idade >= 18:\n    print('Adulto')\nelse:\n    print('Jovem')\n```",
                    "options": ["Adulto", "Jovem", "Erro", "Nada"],
                    "correct": 1,
                    "explanation": "Como 15 é menor que 18, o else é executado."
                }
            },
            {
                "id": "py-4",
                "title": "Loops com for",
                "theory": "# Loop for\n\nPara repetir ações, usamos `for`:\n\n```python\nfor i in range(5):\n    print(i)\n```\n\nIsso imprime 0, 1, 2, 3, 4.\n\nTambém podemos iterar listas:\n\n```python\nfrutas = ['maçã', 'banana', 'uva']\nfor fruta in frutas:\n    print(fruta)\n```",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Quantas vezes o loop `for i in range(3)` executa?",
                    "options": ["2", "3", "4", "Infinitas"],
                    "correct": 1,
                    "explanation": "range(3) gera 0, 1, 2 — três iterações."
                }
            },
            {
                "id": "py-5",
                "title": "Funções",
                "theory": "# Funções\n\nFunções são blocos de código reutilizáveis. Use `def` para criar:\n\n```python\ndef saudacao(nome):\n    return f'Olá, {nome}!'\n\nmensagem = saudacao('Maria')\nprint(mensagem)\n```\n\nA palavra `return` envia um valor de volta.",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual palavra-chave define uma função em Python?",
                    "options": ["function", "func", "def", "define"],
                    "correct": 2,
                    "explanation": "Em Python, usamos def para definir funções."
                }
            }
        ]
    },
    {
        "slug": "javascript",
        "title": "JavaScript",
        "subtitle": "A linguagem da web",
        "description": "Domine JavaScript e crie sites interativos, apps móveis e sistemas modernos.",
        "icon": "⚡",
        "color": "#F7DF1E",
        "level": "Iniciante",
        "lessons": [
            {
                "id": "js-1",
                "title": "Hello, JavaScript!",
                "theory": "# Olá, JavaScript!\n\nJavaScript é a linguagem da web. Para mostrar texto:\n\n```javascript\nconsole.log('Olá, mundo!');\n```\n\nO `console.log` imprime no console do navegador (F12).",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Como imprimir 'Oi' no console em JS?",
                    "options": ["print('Oi')", "console.log('Oi')", "echo 'Oi'", "log.console('Oi')"],
                    "correct": 1,
                    "explanation": "console.log() é a forma padrão de imprimir no console."
                }
            },
            {
                "id": "js-2",
                "title": "let, const e var",
                "theory": "# Variáveis em JS\n\nExistem 3 formas:\n\n```javascript\nlet idade = 25;       // pode mudar\nconst PI = 3.14;       // não pode mudar\nvar nome = 'João';     // antiga, evite\n```\n\nUse `const` por padrão e `let` quando precisar reatribuir.",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual palavra cria uma constante em JS?",
                    "options": ["let", "var", "const", "final"],
                    "correct": 2,
                    "explanation": "const declara uma constante que não pode ser reatribuída."
                }
            },
            {
                "id": "js-3",
                "title": "Arrow Functions",
                "theory": "# Arrow Functions\n\nForma moderna e concisa de criar funções:\n\n```javascript\nconst somar = (a, b) => a + b;\n\nconsole.log(somar(2, 3)); // 5\n```\n\nÉ equivalente a:\n\n```javascript\nfunction somar(a, b) {\n  return a + b;\n}\n```",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual é a sintaxe correta de uma arrow function?",
                    "options": ["() -> {}", "() => {}", "function => {}", "=>() {}"],
                    "correct": 1,
                    "explanation": "Arrow functions usam =>."
                }
            },
            {
                "id": "js-4",
                "title": "Arrays e Métodos",
                "theory": "# Arrays\n\nArrays guardam listas de valores:\n\n```javascript\nconst nums = [1, 2, 3, 4];\n\nnums.push(5);          // adiciona ao fim\nconst dobro = nums.map(n => n * 2);\nconsole.log(dobro);    // [2,4,6,8,10]\n```\n\nMétodos úteis: `map`, `filter`, `reduce`, `forEach`.",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual método cria um novo array transformando cada item?",
                    "options": ["filter", "map", "reduce", "find"],
                    "correct": 1,
                    "explanation": "map() transforma cada elemento e retorna um novo array."
                }
            },
            {
                "id": "js-5",
                "title": "Objetos",
                "theory": "# Objetos\n\nObjetos guardam pares chave-valor:\n\n```javascript\nconst usuario = {\n  nome: 'Carla',\n  idade: 30,\n  saudacao() {\n    return `Olá, sou ${this.nome}`;\n  }\n};\n\nconsole.log(usuario.nome);\nconsole.log(usuario.saudacao());\n```",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Como acessamos a propriedade 'nome' de um objeto `user`?",
                    "options": ["user->nome", "user.nome", "user::nome", "user[nome]"],
                    "correct": 1,
                    "explanation": "Usamos a notação ponto: user.nome"
                }
            }
        ]
    },
    {
        "slug": "html-css",
        "title": "HTML & CSS",
        "subtitle": "Construa sites lindos",
        "description": "Aprenda a estrutura e o estilo das páginas web modernas, do básico ao responsivo.",
        "icon": "🎨",
        "color": "#E34F26",
        "level": "Iniciante",
        "lessons": [
            {
                "id": "html-1",
                "title": "Estrutura HTML",
                "theory": "# Estrutura básica\n\nTodo HTML começa assim:\n\n```html\n<!DOCTYPE html>\n<html lang=\"pt-BR\">\n  <head>\n    <title>Minha página</title>\n  </head>\n  <body>\n    <h1>Olá!</h1>\n  </body>\n</html>\n```\n\n- `<head>` contém metadados\n- `<body>` contém o conteúdo visível",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual tag contém o conteúdo visível da página?",
                    "options": ["<head>", "<body>", "<main>", "<html>"],
                    "correct": 1,
                    "explanation": "A tag <body> contém todo o conteúdo visível."
                }
            },
            {
                "id": "html-2",
                "title": "Tags de Texto",
                "theory": "# Tags comuns\n\n```html\n<h1>Título principal</h1>\n<h2>Subtítulo</h2>\n<p>Um parágrafo de texto.</p>\n<strong>Negrito</strong>\n<em>Itálico</em>\n<a href=\"https://exemplo.com\">Link</a>\n```\n\nExistem `<h1>` até `<h6>` para títulos.",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual tag cria um link em HTML?",
                    "options": ["<link>", "<a>", "<href>", "<url>"],
                    "correct": 1,
                    "explanation": "A tag <a> com atributo href cria links."
                }
            },
            {
                "id": "css-1",
                "title": "Introdução ao CSS",
                "theory": "# CSS básico\n\nCSS estiliza HTML. Sintaxe:\n\n```css\nseletor {\n  propriedade: valor;\n}\n```\n\nExemplo:\n\n```css\nh1 {\n  color: blue;\n  font-size: 32px;\n}\n```\n\nPodemos selecionar por classe `.minha-classe` ou id `#meu-id`.",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual seletor CSS pega elementos com classe 'btn'?",
                    "options": ["#btn", ".btn", "btn", "*btn"],
                    "correct": 1,
                    "explanation": "Classes são selecionadas com ponto: .btn"
                }
            },
            {
                "id": "css-2",
                "title": "Flexbox",
                "theory": "# Flexbox\n\nLayout moderno e flexível:\n\n```css\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 16px;\n}\n```\n\n- `justify-content` alinha no eixo principal\n- `align-items` alinha no eixo cruzado\n- `gap` espaça os filhos",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual propriedade ativa o Flexbox?",
                    "options": ["display: flex", "layout: flex", "flex: true", "position: flex"],
                    "correct": 0,
                    "explanation": "display: flex transforma o elemento em container flex."
                }
            }
        ]
    },
    {
        "slug": "java",
        "title": "Java",
        "subtitle": "Robusta e popular",
        "description": "Linguagem usada em apps Android, sistemas corporativos e servidores de alta performance.",
        "icon": "☕",
        "color": "#ED8B00",
        "level": "Intermediário",
        "lessons": [
            {
                "id": "java-1",
                "title": "Hello, Java!",
                "theory": "# Hello, Java\n\nTodo programa Java tem uma classe e um método `main`:\n\n```java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Olá, mundo!\");\n  }\n}\n```\n\nJava é **compilada** e **fortemente tipada**.",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual método é o ponto de entrada de um programa Java?",
                    "options": ["start()", "main()", "init()", "run()"],
                    "correct": 1,
                    "explanation": "main() é o método executado primeiro."
                }
            },
            {
                "id": "java-2",
                "title": "Tipos e Variáveis",
                "theory": "# Tipos primitivos\n\nJava exige declarar o tipo:\n\n```java\nint idade = 25;\ndouble altura = 1.75;\nboolean ativo = true;\nchar inicial = 'A';\nString nome = \"Pedro\";\n```\n\nTipos primitivos começam com letra **minúscula**, classes com **maiúscula** (ex.: String).",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual tipo guarda números inteiros em Java?",
                    "options": ["string", "int", "float", "char"],
                    "correct": 1,
                    "explanation": "int armazena números inteiros."
                }
            },
            {
                "id": "java-3",
                "title": "Classes e Objetos",
                "theory": "# Classes\n\nJava é orientada a objetos:\n\n```java\npublic class Pessoa {\n  String nome;\n  int idade;\n\n  public void apresentar() {\n    System.out.println(\"Sou \" + nome);\n  }\n}\n\nPessoa p = new Pessoa();\np.nome = \"Ana\";\np.apresentar();\n```",
                "exercise": {
                    "type": "multiple_choice",
                    "question": "Qual palavra-chave cria um novo objeto em Java?",
                    "options": ["create", "new", "make", "instance"],
                    "correct": 1,
                    "explanation": "new instancia uma nova classe."
                }
            }
        ]
    }
]
