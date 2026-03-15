# Campus Connect App

## Project Overview
Campus Connect is a web application designed to facilitate interactions and connections among students, faculty, and staff within university campuses. The application features various modules to enable discussions, event management, resource sharing, and more, creating a vibrant campus community.

## Technologies Used
- **Frontend:** React.js, Redux, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Heroku, GitHub Actions for CI/CD

## Prerequisites
Before you begin, ensure you have the following installed:
- Node.js (>= 14.x)
- npm (Node package manager)
- MongoDB (for local development) or an online MongoDB instance
- Git (for version control)

## Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/curiouscoder85-ai/CampusConnect-app.git
   cd CampusConnect-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables for your MongoDB URI and JWT secret key in a `.env` file:
   ```bash
   MONGODB_URI=<your_mongodb_uri>
   JWT_SECRET=<your_jwt_secret>
   ```
4. Start the application:
   ```bash
   npm start
   ```

## Setup Instructions
- For local development, ensure MongoDB is running, and your environment variables are properly set.
- For production deployment, follow the specific instructions provided in the `DEPLOYMENT.md` file in this repository.

Feel free to explore the codebase and contribute!