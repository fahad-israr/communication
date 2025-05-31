# Catty's Portal

A sweet portal that allows your catty to submit anything that's bothering her. Built with ❤️

## Architecture
- Frontend: React (hosted on GitHub Pages)
- Backend: AWS Lambda + DynamoDB (deployed with Serverless Framework)

## Project Structure
```
.
├── frontend/           # React frontend application
└── backend/           # Serverless backend code
```

## Setup Instructions

### Prerequisites
1. Install Node.js and npm
2. Install Serverless Framework globally:
   ```bash
   npm install -g serverless
   ```
3. Configure AWS credentials:
   ```bash
   serverless config credentials --provider aws --key YOUR_ACCESS_KEY --secret YOUR_SECRET_KEY
   ```

### Backend Setup & Deployment
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Deploy to AWS:
   ```bash
   npm run deploy
   ```
4. Copy the function URL from the output (you'll need it for the frontend)

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file with your Lambda URL:
   ```
   REACT_APP_API_URL=your-lambda-function-url
   ```
4. Start development server:
   ```bash
   npm start
   ```

### Frontend Deployment to GitHub Pages
1. Create a GitHub repository
2. Update the `homepage` field in `package.json` with your GitHub Pages URL
3. Deploy:
   ```bash
   npm run deploy
   ```

## Cleanup
To remove all AWS resources:
```bash
cd backend
npm run remove
```