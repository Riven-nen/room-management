# AI-Driven IT Knowledge Mapping & Learning Recommendation System

## Overview
This is a **freelance project** developed for a university capstone defense. The client required a modernized academic tracking system that moves beyond simple grade storage and provides actionable insights for both students and faculty.

The platform is a full-stack Next.js application powered by Supabase and an AI tutor (Groq). It features role-based access for students, admins, and Deans, visualizes academic progress through interactive graphs, and provides AI-driven career recommendations based on actual curriculum mapping.

## Key Features

### Student Dashboard
- **Knowledge Map:** A dynamic radar chart visualizing the student's proficiency across 7 core IT domains (Programming, Networking, Database, etc.) based on their actual grades.
- **AI Recommendation Matrix:** Compares the student's current domain scores against target Career Paths (e.g., Web Developer, Data Analyst) and generates personalized advice.
- **Interactive Roadmap:** A visual prerequisite tree showing which courses are locked, in progress, or completed.

### Course Syllabus and AI Tutor
- **Deep Course Trees:** Each course contains a nested, hierarchical tree of topics (up to 127 nodes) that unlock sequentially as the student progresses.
- **AI Course Tutor:** A context-aware chatbot that knows the specific course syllabus and can answer questions based on the current lesson material.
- **Quizzes and Grading:** Students can take topic quizzes. The system automatically calculates the grade using the Philippine grading system and updates their overall proficiency.
- **Resource Library:** Each topic includes curated external links (videos, articles, docs) for further reading.

### Admin Panel
- **Program Analytics:** Aggregated bar charts showing where the entire student body is struggling, allowing the Dean to adjust the curriculum.
- **Manage Topics:** A live CRUD interface for Admins to add new topics, create prerequisites, and link resources directly from the UI without touching SQL.
- **Role-Based Access Control:** Secure login for Students and Admins with Supabase Row Level Security (RLS).

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database and Auth:** Supabase (PostgreSQL + RLS)
- **Styling:** CSS Modules (No Tailwind)
- **Graph Layout:** React Flow + Dagre
- **AI Integration:** Groq API (Llama 3)
- **Charts:** Recharts

## Setup and Installation
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env.local` file with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY`
4. Run `npm run dev`.

## Project Status
Delivered as a freelance engagement. The core functionality is complete and ready for the university capstone defense.
