# 🚀 JVM Architecture & Bytecode Emulator

An interactive, browser-based **Java Virtual Machine (JVM) Architecture & Bytecode Emulator** designed to visualize low-level runtime execution, stack frames, operand stack operations, local variable tables (LVT), and real-time heap topology. 

Bridging the gap between high-level Java code and low-level bytecode execution, this tool serves as an educational and debugging powerhouse for understanding internal JVM internals.



## ✨ Key Features

🖥️ Interactive Execution Dashboard**: Step-by-step bytecode execution with controls (`Run`, `Step`, `Reset`, and adjustable clock speed).
📚 LeetCode Integration**: Load common problems (e.g., *Two Sum*) to observe how standard algorithmic code translates into execution frames and bytecode streams.
🧠 Call Stack & Thread Frames**: Real-time visualization of active methods, stack depth, and Program Counter (PC) registers.
📦 Operand Stack & LVT Viewers**: Live monitoring of LIFO operand stack operations and Local Variable Table slot allocations.
🌳 D3 JVM Heap Visualizer**: Real-time graphical representation of heap allocations, reference graphs, address strips, and garbage collection metrics (Eden/New Space, Live Pointers, etc.).
🗺️ JVM Map & Architecture Specs**: Built-in tabs for inspecting memory areas, method areas, and execution engine workflows.



## 🛠️ Tech Stack

* Core Backend / Emulator**: Java, Maven (`pom.xml`), JVM runtime logic.
* Frontend / Interface**: TypeScript, React / HTML5, Vite (`vite.config.ts`), Bun (`bun.lock`).
* Visualizations**: D3.js for interactive heap graphs and memory topologies.



## 📂 Project Directory Structure

```text
jvm-architecture-and-bytecode-emulator/
1. .vscode/               # VS Code workspace settings
2. jvm-emulator/          # Core Java emulator engine & Maven configuration
   ├── src/               # Java source files (runtime, bytecode parser, memory models)
   ├── target/            # Compiled build outputs
   └── pom.xml            # Maven project descriptor
3. src/                   # Frontend web application source code
4. public/                # Static assets and icons
5. index.html             # Main entry point for the web application
6. package.json           # Node/Bun dependencies and scripts
7. tsconfig.json          # TypeScript compiler configuration
8. vite.config.ts         # Vite build and dev server configuration
9. README.md              # Project documentation
