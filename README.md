# PaperCut
# Company Feedback System

A simple internal feedback system for collecting and managing improvement ideas from employees, built with React and Azure Static Web Apps.

## Features

- Submit improvement ideas with titles and descriptions
- View all submitted ideas on a central board
- Upvote ideas you support
- Comment on existing ideas
- Optional anonymous posting
- Sort by newest or most voted
- Assign status, department tags, and priority scores to ideas
- Azure AD authentication integration
- Admin role for managing suggestions
- Persistent data storage with Azure Cosmos DB

## Architecture

- **Frontend**: React with Tailwind CSS
- **Backend**: Azure Functions API
- **Authentication**: Azure AD integration via Static Web Apps auth
- **Database**: Azure Cosmos DB
- **Hosting**: Azure Static Web Apps

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Azure account
- Azure Static Web Apps CLI (`npm install -g @azure/static-web-apps-cli`)
- Azure Functions Core Tools (for local development)

### Local Development Setup

1. Clone this repository
```bash
git clone https://github.com/your-username/papercut.git
cd papercut
```

2. Install dependencies for the frontend
```bash
npm install
```

3. Install dependencies for the API
```bash
cd api
npm install
cd ..
```

4. Configure the API with your Cosmos DB details
   - Update `/api/local.settings.json` with your Cosmos DB endpoint, key, and database information

5. Start the development server with Azure SWA CLI:
```bash
swa start http://localhost:3000 --api-location ./api
```

6. In a separate terminal, start the React app:
```bash
npm start
```

7. Open your browser to http://localhost:4280

## Deployment to Azure

1. Create an Azure Static Web App in the Azure Portal

2. Create an Azure Cosmos DB account, database, and container
   - Set up a container named `suggestions` with `/id` as the partition key

3. Configure your Static Web App with the following Application Settings:
   - `COSMOS_ENDPOINT`: Your Cosmos DB endpoint
   - `COSMOS_KEY`: Your Cosmos DB key
   - `COSMOS_DATABASE_ID`: Your database name (e.g. `papercut-db`)
   - `COSMOS_CONTAINER_ID`: Your container name (e.g. `suggestions`)

4. Configure Azure AD integration in the Azure Portal:
   - Set up an Enterprise Application
   - Configure the app registration for your Static Web App
   - Add admin roles to specific users if needed

5. Link your GitHub repository to the Static Web App for CI/CD deployment

## Azure Functions API Endpoints

The backend consists of the following API endpoints:

- `GET /api/suggestions` - Get all suggestions
- `GET /api/suggestions/{id}` - Get a specific suggestion
- `POST /api/suggestions` - Create a new suggestion
- `PUT /api/suggestions/{id}` - Update a suggestion (admin role required for some updates)
- `POST /api/suggestions/{id}/comments` - Add a comment to a suggestion
- `POST /api/suggestions/{id}/vote` - Vote for a suggestion

All API endpoints require authentication through Azure Static Web Apps auth.

## Future Enhancements

- Email notifications for status changes
- Analytics dashboard
- File attachments
- Mobile app support
- Custom field support for different departments

## License

MIT
