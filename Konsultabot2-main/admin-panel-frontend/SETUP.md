# Admin Panel Frontend Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd admin-panel-frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and set REACT_APP_API_BASE_URL to your Django backend URL
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Access the Admin Panel**
   - Open http://localhost:3000
   - Login with admin credentials

## Default Login

Use an admin user from your Django backend:
- Email: (your admin email)
- Password: (your admin password)

The user must have `role='admin'` or `is_staff=True` in Django.

## Building for Production

```bash
npm run build
```

The `build/` folder will contain production-ready static files that can be served by any web server or integrated into Django.

## Integration with Django

To serve the React app from Django:

1. Build the React app: `npm run build`
2. Copy the `build/` folder contents to Django's `static/` directory
3. Update Django URLs to serve the React app

Or use a separate web server (nginx, Apache) to serve the React app.

## Troubleshooting

### CORS Issues
If you see CORS errors, ensure Django has CORS configured:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Development only
```

### API Connection Failed
- Check that Django backend is running on the correct port
- Verify `REACT_APP_API_BASE_URL` in `.env` matches your backend URL
- Check browser console for detailed error messages

### Authentication Issues
- Ensure you're using a user with admin role
- Check that JWT token is being stored in localStorage
- Verify Django authentication endpoints are working

