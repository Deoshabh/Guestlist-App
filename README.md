# Bhaujan Vypar Application

This project consists of a React frontend and Node.js/Express backend for the Bhaujan Vypar application.

## Project Structure

### Frontend

```
frontend/
├── public/
├── src/
│   ├── assets/        # Static assets like images, fonts
│   ├── components/    # Reusable UI components
│   │   ├── common/    # Shared components
│   │   ├── layout/    # Layout components
│   │   └── forms/     # Form components
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── utils/         # Utility functions
│   ├── App.js         # Main App component
│   └── index.js       # Entry point
└── package.json
```

### Backend

```
backend/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Express middleware
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── index.js       # Entry point
└── package.json
```

## Code Modularity Guidelines

1. **Maximum File Size**: No file should exceed 500 lines of code (enforced by ESLint).
2. **Component Structure**:
   - Each React component should be in its own file
   - Group related components in their own directory
   - Create index.js files to export components from directories

3. **Backend Modularity**:
   - Routes should only contain route definitions and middleware
   - Business logic should be in controllers or services
   - Split large controllers into smaller, focused modules

4. **Code Organization**:
   - Break down large functions into smaller, focused functions
   - Use utility functions for reusable logic
   - Keep models simple and use services for complex operations
