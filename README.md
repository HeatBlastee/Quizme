Quizmify 🎯
A smart and interactive quiz platform built with Next.js, ShadCN UI, PostgreSQL, Prisma, and AI integration.

🔗 Live Demo: https://quizzzme.vercel.app/

🚀 Features
🧠 AI-powered question generation (MCQ & Open-ended)

✅ Auto-answer checking using string similarity algorithms

📚 Topics-based quiz system

🕒 Recent activity tracking

📈 Performance history and stats

🎨 Beautiful UI with responsive design using ShadCN UI + Tailwind CSS

🔐 Auth with Google OAuth via NextAuth.js

🔒 Secure routes with server-side session handling

📦 Prisma ORM with PostgreSQL

🛠️ Tech Stack
Frontend: Next.js 14 (App Router), TypeScript, TailwindCSS, ShadCN UI

Backend: Next.js API Routes, Prisma ORM, PostgreSQL

Auth: NextAuth.js (Google OAuth)

AI & Utilities: OpenAI / Azure AI API (for question generation), string-similarity for answer checking

📦 Installation & Setup
1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/your-username/quizme.git
cd quizme
2. Install Dependencies
bash
Copy
Edit
npm install
3. Configure Environment Variables
Create a .env file at the root and add the following:

env
DATABASE_URL=
GOOGLE_CLIENT_ID = 
GOOGLE_CLIENT_SECRET =
NEXTAUTH_SECRET = 
OPENAI_API_KEY =
GITHUB_TOKEN = 
API_URL = "http://localhost:3000"


4. Set Up the Database
npx prisma generate
npx prisma db push

🧪 Run Locally
npm run dev
App will be running at http://localhost:3000

🧠 How It Works
User Authentication

Users can log in with their Google accounts using NextAuth.js.

Quiz Dashboard

After login, users land on the dashboard where they can:

View recent activity

Take topic-based quizzes

Track performance stats

Quiz Generation

When the user clicks "Quiz Me", AI-generated questions are fetched via API routes using Azure OpenAI / OpenAI's API.

Both multiple-choice and open-ended questions are supported.

Answer Checking

Open-ended answers are checked using fuzzy string matching (like compareTwoStrings).

MCQs are checked by comparing selected options.

History Tracking

User quiz attempts and scores are stored and displayed on the dashboard using PostgreSQL and Prisma.

🖼️ UI Components
Built using ShadCN UI components like:

Dialogs

Cards

Buttons

Tabs

Toasts

Styled with TailwindCSS and responsive design principles.

🧩 Folder Structure (Simplified)
pgsql
Copy
Edit
/app
  /dashboard     --> Protected routes & components
  /api           --> Quiz APIs, Auth, Answer Checkers
/components      --> UI Reusable Components
/lib             --> Utility functions and NextAuth setup
/prisma          --> Prisma schema & migration files
/schemas         --> Zod schemas for validation
/types           --> TypeScript types
📈 Future Improvements
Add user leaderboard

Enable custom question creation

Integrate timed quizzes

Add support for more languages and subjects

Add explanation for answers

🤝 Contributing
Pull requests and stars are welcome!

# Format code before PR
npm run lint
