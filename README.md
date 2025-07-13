# MovieApp: React + TMDB + Appwrite

A modern movie discovery and recommendation app built with **React**, **Tailwind CSS**, and **Appwrite** (BaaS). It fetches movie data from **TMDB (The Movie Database)** API, tracks search counts, and displays trending searches in a smooth horizontal carousel. User authentication (signup/login) and session management are handled by Appwrite.

## 🚀 Features

* **Movie Search**: Search TMDB for movies by title with debounced input.
* **Discover Popular**: View a list of popular movies by default.
* **Trending Carousel**: Shows top searched terms as a horizontal scrollable carousel.
* **Search Count Tracking**: Each search term increments a count in Appwrite database.
* **User Auth**: Email/password signup, login, and logout via Appwrite Account service.
* **Protected UI**: Only authenticated users can search and view trending lists.
* **Responsive Design**: Mobile-first layout using Tailwind CSS.

## 📚 Tech Stack

* **Frontend**: React, Vite, Tailwind CSS
* **Backend-as-a-Service**: Appwrite (Authentication, Database)
* **Movie API**: TMDB API (v3)
* **State Management**: React `useState`, `useEffect`, and context
* **Utilities**: `react-use` for `useDebounce`

## 🛠️ Prerequisites

* Node.js (>=14)
* npm or yarn
* Appwrite account (cloud or self‑hosted)
* TMDB API key

## 🔧 Setup & Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/<your-username>/movieapp.git
   cd movieapp
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Variables**
   Create a `.env` file in project root:

   ```ini
   VITE_APPWRITE_PROJECT_ID=your_appwrite_project_id
   VITE_APPWRITE_DATABASE_ID=your_appwrite_database_id
   VITE_APPWRITE_COLLECTION_ID=your_appwrite_collection_id
   VITE_TMDB_API_KEY=your_tmdb_api_key
   ```

4. **Configure Appwrite**

   * In Appwrite Console, under **Settings ▶ Platform**, add `http://localhost:5173` to Domains and CORS.
   * Create a Database and Collection for trending searches.
   * Enable **Email/Password** auth in Appwrite.

5. **Initialize Tailwind** (if not already)

   ```bash
   npx tailwindcss init -p
   ```

   Verify `tailwind.config.js` includes:

   ```js
   module.exports = {
     content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
     theme: { extend: {} },
     plugins: [require('tailwind-scrollbar')],
   };
   ```

6. **Run the App**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

Open `http://localhost:5173` in your browser. You should see the login screen. After signing up or logging in, you can search for movies and view the trending carousel.

## 🗂️ Project Structure

```
movieapp/
├── public/
│   └── hero.jpg             # Hero banner image
├── src/
│   ├── components/
│   │   ├── Search.jsx       # Movie search input
│   │   ├── Spinner.jsx      # Loading spinner
│   │   ├── MovieCard.jsx    # Movie result card
│   │   ├── LoginForm.jsx    # Login form
│   │   └── SignupForm.jsx   # Signup form
│   ├── contexts/
│   │   └── AuthContext.jsx  # Auth provider & hook
│   ├── appwrite.js          # Appwrite client & API methods
│   ├── App.jsx              # Main app component
│   ├── index.css            # Tailwind imports + custom styles
│   └── main.jsx             # ReactDOM root + AuthProvider
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

## 🔒 Authentication Flow

1. **Sign Up**: Creates Appwrite user & email session (`account.create`, `createEmailSession`).
2. **Login**: Creates email session and fetches current user.
3. **Protected Routes**: `AuthContext` provides `user`; UI conditionally renders based on auth state.
4. **Logout**: Deletes current session (`account.deleteSession('current')`).

## 🎨 Styling & UX

* **Tailwind CSS** for utility-first styling.
* **scroll-smooth** + **overflow-x-auto** for horizontal carousel.
* **Tailwind‑scrollbar** plugin for clean thin scrollbar.
* **Debounce** user input to minimize API calls.

## 📈 Extending the App

* **Auto-scroll** or **scroll snap** for carousel.
* **User watchlists** & **favorites** in Appwrite.
* **Comments & reviews** per movie.
* **Social features**: follow users, share lists.
* **Serverless functions** for recommendations.

## 👤 Author

* **Your Name** – [YourGitHub](https://github.com/<turbocyborg>)

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.
