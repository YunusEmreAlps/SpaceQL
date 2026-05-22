<!-- Interactive SQL Visualizer -->

# SQLSpace

SQLSpace is an open-source project that visualizes SQL queries in real-time using Three.js. It features an "Interactive SQL Editor" mode where users can type SQL queries and see them come to life as 3D animations. The platform is built with a strict stack of Vanilla ES6, Three.js, Tailwind CSS, GSAP, SQL.js, and Monaco Editor, all loaded via CDN.

## Table of Contents

- [SQLSpace](#sqlspace)
  - [Table of Contents](#table-of-contents)
  - [Built With](#built-with)
  - [Key Features](#key-features)
  - [Development Guide](#development-guide)
    - [1. Prerequisites](#1-prerequisites)
    - [2. Installation](#2-installation)
  - [Architecture](#architecture)
  - [License](#license)
  - [Contributing](#contributing)
  - [Contact](#contact)

## Built With

- [Three.js](https://threejs.org/) - 3D visualization engine
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor with SQL syntax highlighting
- [GSAP 3](https://greensock.com/gsap/) - Animation library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vanilla ES6](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - Pure JavaScript modules
- [SQL.js](https://sql.js.org/) - SQLite engine for real SQL execution in browser

## Key Features

- **Real-Time Visualization**: See your SQL queries come to life as 3D animations in real-time.
- **Interactive SQL Editor**: Type SQL queries and watch them transform into interactive 3D scenes.
- **Strict Stack**: Built with Vanilla ES6, Three.js, Tailwind CSS, GSAP, SQL.js, and Monaco Editor, all loaded via CDN for optimal performance and ease of use.

## Development Guide

### 1. Prerequisites

- A modern web browser (Chrome, Firefox, Edge)
- Python 3 for running a local server (or any static file server of your choice)
- Basic knowledge of SQL and JavaScript
- Familiarity with Three.js and GSAP is a plus but not required
- Understanding of ES6 modules and browser-based development
- No backend or build tools are required; everything runs in the browser with CDN dependencies
- A text editor for editing code (VSCode, Sublime Text, etc.)
- Git for version control and collaboration

### 2. Installation

To get started with SQLSpace, simply clone the repository and open the `index.html` file in your web browser. You can start typing SQL queries in the editor and see the visualizations in real-time.

```bash
# Move to your workspace
cd <your-workspace>

# Clone this project into your workspace
git clone <repository-url>

# Move to the project root directory
cd sqlspace

# Open the project in your favorite IDE
code . # For Visual Studio Code

# Run a local server (Python 3)
python3 -m http.server 8080
```

Then, open your browser and go to `http://localhost:8080` to see SQLSpace in action.

> No Environment Variables, no API keys, no build steps. Just open the HTML file and start learning SQL visually!

## Architecture

The project is structured in a layered architecture with the following layers:

```bash
.
├── index.html              # Main application page
├── js/
│   ├── core/
│   │   ├── scene.js       # Three.js scene management
│   │   └── utils.js       # Utility functions
│   ├── data/
│   │   ├── examples.js    # SQL example queries
│   │   ├── suggestions.js # Monaco autocomplete definitions
│   │   └── tables.js      # Database schema definitions
│   ├── engine/
│   │   ├── parser.js      # SQL query parser
│   │   └── engine.js      # Visualization dispatcher
│   └── visualizers/
│       ├── base.js        # Base visualizer class
│       ├── select.js      # SELECT query visualizer
│       ├── insert.js      # INSERT query visualizer
│       ├── update.js      # UPDATE query visualizer
│       ├── delete.js      # DELETE query visualizer
│       └── create.js      # CREATE TABLE visualizer
└── docs/
    └── spec.md            # Full specification
```

## License

This project is open source and available under the MIT License.

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Contact

Thanks to the following people who have contributed to this project:

- [Yunus Emre Alpu](https://www.linkedin.com/in/yunus-emre-alpu) - Creator and Maintainer