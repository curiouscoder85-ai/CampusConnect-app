# Running Your CampusConnect Project Locally

This guide provides step-by-step instructions to set up and run your CampusConnect application on your local machine.

## Prerequisites

- **Node.js**: Make sure you have Node.js (version 18 or later) installed.
- **Git**: You need Git to clone your repository.
- **Firebase Project**: You should have access to the Firebase project associated with this application (`studio-8538265363-6bce8`).

---

## Step 1: Clone Your Repository

First, clone your project from your Git repository to your local machine.

```bash
git clone <your-repository-url>
cd <your-project-directory>
```

---

## Step 2: Install Dependencies

Once you are in the project directory, install all the necessary Node.js packages using `npm`.

```bash
npm install
```

---

## Step 3: Set Up Environment Variables

To run the application locally, you need to provide credentials for the services it uses (Firebase and Google AI).

1.  **Create an Environment File**: In the root directory of your project, create a new file named `.env.local`.

2.  **Get Your Gemini API Key (for Genkit)**:
    - Go to the [Google AI Studio dashboard](https://aistudio.google.com/app/apikey).
    - Click **"Create API key"** and copy the generated key.
    - Add it to your `.env.local` file:
      ```
      GEMINI_API_KEY=your_gemini_api_key_here
      ```

3.  **Get Your Firebase Service Account Key (for Firebase Admin)**:
    The AI tools in your application (like `getUserProfile`) use the Firebase Admin SDK to securely access data on the backend. This requires a service account key.
    - Go to your [Firebase Console](https://console.firebase.google.com/project/studio-8538265363-6bce8/settings/serviceaccounts/adminsdk).
    - Make sure you are in the correct project (`studio-8538265363-6bce8`).
    - Click the **"Generate new private key"** button. A JSON file will be downloaded.
    - **SECURITY NOTE**: Treat this file like a password. Do not commit it to your Git repository.
    - Move this downloaded JSON file into the root of your project and rename it to `firebase-service-account.json`.
    - Add the path to this file in your `.env.local`:
      ```
      GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
      ```

Your final `.env.local` file should look like this:

```
# For Genkit AI Features
GEMINI_API_KEY=your_gemini_api_key_here

# For Firebase Admin SDK (used by Genkit tools)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

---

## Step 4: Run the Development Servers

This project requires two development servers running at the same time in separate terminal windows:
1.  The **Next.js frontend** application.
2.  The **Genkit AI** server for your AI flows.

**Terminal 1: Start the Genkit AI Server**
```bash
npm run genkit:watch
```
This command starts the Genkit server and will automatically restart it if you make changes to your AI flows.

**Terminal 2: Start the Next.js Frontend**
```bash
npm run dev
```
This command starts the main web application.

Once both servers are running, you can open your browser and navigate to **http://localhost:9003** to see your application live!

You are all set! You can now continue developing and testing your project on your local machine.