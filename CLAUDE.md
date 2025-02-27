# PaperCut Development Guide

## Build & Development Commands
- Start frontend: `npm start`
- Build frontend: `npm run build`
- Run tests: `npm test`
- Run specific test: `npm test -- -t "test name"` 
- Start API locally: `cd api && npm run start`
- Full stack local dev: `swa start http://localhost:3000 --api-location ./api`

## Code Style Guidelines
- React functional components with props destructuring
- TailwindCSS for styling with responsive design patterns
- Error handling: Use try/catch blocks with specific error messages
- Exports: Default exports for components, named exports for utilities
- Naming: camelCase for variables/functions, PascalCase for components
- File structure follows feature organization with clear separation
- API service patterns: Centralized API calls with error handling
- Consistent use of async/await for promises
- Status handling via descriptive enums: 'New', 'In Progress', etc.
- Authentication via Azure AD integrated through context providers

## Project Structure
- Frontend: React + Tailwind CSS
- Backend: Azure Functions API with Cosmos DB
- Authentication: Azure AD integration via Static Web Apps

## Note to Agents
When you learn new information about this codebase (build commands, testing procedures, style conventions, etc.), please proactively suggest updating this CLAUDE.md file to keep it current and helpful for future sessions.