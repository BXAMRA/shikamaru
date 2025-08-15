# Shikamaru Project Manager v1.0.0

Shikamaru is a lightweight, self-hosted project and task management application designed for simplicity and efficiency. It provides a clean, responsive interface for organizing nested projects, managing tasks through a Kanban-style board, and tracking progress.



## Features

- **Nested Project Organization**: Create projects and sub-projects to any depth, allowing for detailed and hierarchical planning.
- **Drag-and-Drop Interface**:
  - Easily reorder projects and move them between parent projects directly in the sidebar.
  - Move tasks between different stages (Planned, In Progress, etc.) on the Kanban board with a simple drag and drop.
- **Kanban Task Board**: Visualize your workflow with a board that includes sections for _Planned_, _In Progress_, _Under Review_, _Finished_, and _Suggested_ tasks.
- **In-Place Editing**: Click on any project or task title to edit it directly in the view, saving changes automatically.
- **Progress Tracking**: Add timestamped progress notes to any task to keep a detailed log of updates.
- **Fully Responsive Design**: The interface adapts smoothly to all screen sizes, from desktop monitors to mobile phones. On mobile, the sidebar becomes a slide-out panel for easy access.
- **Confirmation Dialogs**: Destructive actions, such as deleting a project or a task, require user confirmation to prevent accidental data loss.
- **Dynamic Content Loading**: The application is a Single Page Application (SPA) that loads and updates data dynamically from the backend without requiring page reloads.



## Technologies Used

- **Backend**:
  - **Node.js** with **Express.js**: For creating a fast and simple RESTful API server.
  - **SQLite**: A file-based SQL database engine used for all data storage. The database (`shikamaru.db`) is stored in the project's root directory.
- **Frontend**:
  - **Vanilla JavaScript (ES6+)**: No frontend frameworks are used, keeping the client-side code lightweight and fast.
  - **Bootstrap 5.3**: Used for the core layout, responsive grid system, and modal components.
  - **Bootstrap Icons**: Provides a clean and comprehensive set of icons used throughout the interface.
- **Development Environment**:
  - **NPM**: For managing project dependencies.




## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You must have [Node.js](https://nodejs.org/) installed on your system. This will also install `npm`. You can verify your installation by running:

```
node-v
npm-v
```

### Installation & Setup

1.  **Clone the repository:**

    ```
    git clone https://github.com/BXAMRA/shikamaru.git
    cd shikamaru
    ```

2.  **Install dependencies:**
    This will install Express, SQLite, and other required packages.

    ```
    npm install
    ```

3.  **Configure the server (Optional):**
    By default, the server runs on `0.0.0.0` at port `3000`. You can change these settings by editing the `server.js` file.

    Open `server.js` and modify these lines:

    ```
    const port = 3000; // Change to your desired port
    const host = '0.0.0.0'; // Change to 'localhost' if you only want local access
    ```

    I have an old android device setup to act as a server for my home network using termux. So setting '0.0.0.0' allows the application access to every device on the network by assigning a static address eg 192.168.31.100:3000

### Running the Application

Once the setup is complete, you can start the application with a single command:

```
npm start
```

This will start the server, and your default web browser should automatically open to the application. If it doesn't, you can manually navigate to:

**`http://localhost:3000`**



## How It Works

The application consists of a Node.js backend that serves a set of RESTful APIs and a `public` folder containing the frontend assets.

- The frontend (`index.html`, `style.css`, `app.js`) is fully static and is served from the `public` directory.
- All dynamic data (projects, tasks, progress notes) is fetched by the frontend via API calls to the server.
- The backend communicates with the `shikamaru.db` SQLite database to perform all CRUD (Create, Read, Update, Delete) operations.
