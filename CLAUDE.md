# PaperCut Development Guide

## Build & Development Commands
- Start frontend: `npm start`
- Build frontend: `npm run build` (uses CI=false to ignore warnings)
- Run tests: `npm test` (with --passWithNoTests flag)
- Run specific test: `npm test -- -t "test name"` 
- Start API locally: `cd api && npm run start`
- Full stack local dev: `swa start http://localhost:3000 --api-location ./api`

## Code Style Guidelines
- React functional components with props destructuring
- TailwindCSS for styling with responsive design patterns 
- Error handling: try/catch blocks with standardized error messages via errorHandler
- File structure: components/, services/, utils/, contexts/ directories
- API convention: RESTful endpoints in /api folder with consistent patterns
- Naming: camelCase for variables/functions, PascalCase for components
- Authentication: Headers for admin access via 'X-Admin-Status'
- Status values: 'New', 'In Progress', 'Under Review', 'Implemented', 'Declined', 'Merged'
- Consistent use of async/await pattern with separate error handling

## Backend Integration
- Azure Functions API with Cosmos DB for persistence
- Azure Blob Storage for file attachments
- Authentication via Azure AD integration
- Suggestion workflow: create → vote → update status → comment → merge/implement

## Architecture Notes
- This is an Azure static web app with Cosmos NoSQL database and blob storage
- Full implementation must include both frontend and backend components
- Always implement complete E2E functionality for any feature request

## Note to Agents
When you learn new information about this codebase (build commands, testing procedures, style conventions, etc.), please proactively suggest updating this CLAUDE.md file.