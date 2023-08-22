# Simple SketchPad Drawing Project


This repository contains the software engineering project for the "Software Engineering for Human-Computer Interface Design" course in the Faculty of Engineering at the University of Western Ontario. The project involves the design and implementation of a simple sketch drawing program with various features.

## Project Description

### Overview

The goal of this project is to design and implement a simple sketch drawing program that allows users to create and manipulate 2D graphical objects. The program should support the following features:

- Drawing freehand sketches with scribbled freehand lines.
- Drawing straight lines.
- Drawing rectangles.
- Drawing ellipses.
- Drawing special cases of rectangles (squares) and ellipses (circles).
- Drawing polygons (open and closed polygons).
- Selecting colors for graphical objects.

Additionally, users should be able to:

- Select and manipulate existing graphical objects by:
    - Moving the selected object to a new location.
    - Cutting the object from the drawing (deleting a graphical object).
    - Pasting the selected object (copy and paste) to a new location.

[//]: # (### Advanced Features)

[//]: # ()
[//]: # (Advanced versions of the program may include the following functionality:)

[//]: # ()
[//]: # (- Grouping objects together &#40;possibly creating groups of arbitrary objects&#41;.)

[//]: # (- Ungrouping a set of objects that have been grouped.)

### Very Advanced Features

Very advanced versions of the program could contain the following additional functions:

- Undo and Redo functionality.

[//]: # (- Save and Load a partially completed drawing, allowing users to extend it or modify/move/paste parts of it.)

[//]: # (## Project Artifacts)

[//]: # (This repository contains the following design artifacts:)

[//]: # ()
[//]: # (- **Statecharts**: Statecharts representing the interactive functions of the program.)

[//]: # (- **Object Diagram**: An object diagram representing the software architecture and any design patterns used in the project.)

[//]: # (- **Source Code**: All source code and files needed to create an executable system.)

[//]: # (- **Demo**: A demo of the program's functionality, which can be either a live demonstration using Zoom or an uploaded video demo.)

## Getting Started

To get started with a Vite React project, follow these steps:

**Prerequisites:**
- Node.js installed on your machine (you can download it from [nodejs.org](https://nodejs.org/))
- npm or yarn package manager (npm is included with Node.js, but you can also use yarn if you prefer)

### Step 1: Create a New Vite React Project

1. Open your terminal or command prompt.

2. Use the following command to create a new Vite React project. Replace `my-react-app` with your desired project name:

   ```bash
   npm init @vitejs/app my-react-app --template react
   ```

   Or if you prefer yarn:

   ```bash
   yarn create @vitejs/app my-react-app --template react
   ```

3. Vite will prompt you to select a template. Choose the `react` template.

4. Vite will create a new directory with your project name (`my-react-app` in this example) and set up the initial project structure.

### Step 2: Navigate to Your Project Directory

Navigate to the project directory using the `cd` command:

```bash
cd my-react-app
```

### Step 3: Install Dependencies

Use your preferred package manager to install the project dependencies (npm or yarn):

```bash
npm install
```

Or with yarn:

```bash
yarn
```

This will install all the necessary dependencies specified in the project's `package.json` file.

### Step 4: Start the Development Server

You can now start the development server by running the following command:

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

This command will start the development server, and you will see a message indicating where your application is running (usually at `http://localhost:3000`).

### Step 5: Start Coding

Your Vite React project is now set up and running. You can start coding by editing the files in the `src` directory. The entry point for your React application is typically `src/main.js` or `src/main.jsx`.

You can create new React components, modify existing ones, and build your application as needed. Vite's fast development server will automatically update the browser as you make changes, making the development process smooth and efficient.

### Step 6: Build for Production

When you're ready to build your React application for production, you can run the following command:

```bash
npm run build
```

Or with yarn:

```bash
yarn build
```

This will create an optimized production build in the `dist` directory. You can deploy this build to a web server or hosting service of your choice.

That's it! You're now ready to start building your React application using Vite. Enjoy the fast development experience that Vite provides!

## Contribution Guidelines

Contributions to this project are welcome. If you have ideas for improvements or additional features, please create a new branch, make your changes, and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

---

**Note:** This repository is for educational purposes as part of the "Software Engineering for Human-Computer Interface Design" course at the University of Western Ontario. It may not be actively maintained beyond the course duration.