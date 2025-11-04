# Zonta Club of Naples Website

A full-stack web application for the Zonta Club of Naples. The project consists of a modern, responsive frontend built with HTML, CSS, and JavaScript, and a RESTful API backend built with Node.js and Express.

## Project Structure

```
zonta/
├── frontend/               # Frontend application
│   ├── index.html         # Homepage
│   ├── css/               # Stylesheets
│   │   ├── styles.css     # Main stylesheet
│   │   └── shop.css       # Shop page styles
│   ├── js/                # JavaScript files
│   │   ├── main.js        # Main JavaScript file
│   │   ├── nav-footer-share.js  # Shared header/footer management
│   │   └── shop.js        # Shop page functionality
│   ├── pages/             # HTML pages
│   │   ├── about.html
│   │   ├── service.html
│   │   ├── advocacy.html
│   │   ├── scholarships.html
│   │   ├── membership.html
│   │   ├── events.html
│   │   └── shop.html
│   ├── includes/          # Reusable components
│   │   ├── header.html
│   │   └── footer.html
│   ├── images/            # Image assets
│   └── README.md          # Frontend documentation
│
├── backend/               # Backend API
│   ├── src/
│   │   └── index.js       # Express server entry point
│   ├── config/            # Configuration files
│   ├── package.json       # Dependencies
│   ├── .env.example       # Environment variables template
│   └── README.md          # Backend documentation
│
└── README.md              # This file
```

## Features

### Frontend
- ✅ **Fully Responsive**: Works on all devices (desktop, tablet, mobile)
- ✅ **Modern Design**: Clean, professional layout with smooth animations
- ✅ **Multi-Page Architecture**: Separate pages for different sections
- ✅ **Mobile Navigation**: Hamburger menu for mobile devices
- ✅ **Smooth Scrolling**: Enhanced user experience with smooth scroll effects
- ✅ **Intersection Observer**: Animated elements on scroll
- ✅ **Counter Animation**: Animated statistics counters
- ✅ **Modular Structure**: Separated HTML, CSS, and JavaScript

### Backend
- ✅ **RESTful API**: Built with Express.js
- ✅ **Environment Configuration**: Using dotenv for secure config
- ✅ **CORS Enabled**: Cross-origin resource sharing support
- ✅ **Health Check Endpoint**: Monitor API status
- ✅ **Scalable Structure**: Organized codebase for easy expansion

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (v14 or higher) - for backend API
- A web server (optional, for frontend local development)

### Installation

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Serve the files using any of these methods:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## Pages

- **Home** (`frontend/index.html`): Landing page with hero section, services overview, and statistics
- **Who We Are** (`frontend/pages/about.html`): Organization history, mission, and values
- **Service** (`frontend/pages/service.html`): Community service initiatives
- **Advocacy** (`frontend/pages/advocacy.html`): Service areas and advocacy work
- **Scholarships** (`frontend/pages/scholarships.html`): Available scholarships and applications
- **Membership** (`frontend/pages/membership.html`): Membership benefits and application
- **Events** (`frontend/pages/events.html`): Meetings, events, and activities
- **Shop** (`frontend/pages/shop.html`): Online store

## API Endpoints

- `GET /` - API welcome message
- `GET /health` - Health check endpoint

## Tech Stack

### Frontend
- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript
- Responsive Design

### Backend
- Node.js
- Express.js
- CORS
- dotenv

## Customization

### Frontend Colors

Edit the CSS variables in `frontend/css/styles.css`:

```css
:root {
    --primary-color: #8B3A3C;
    --secondary-color: #E6A117;
    --accent-color: #00BCD4;
    --dark: #5C2526;
    --light: #FFF9E6;
    --white: #FFFFFF;
    --gray: #6B7280;
    --light-gray: #F3F4F6;
}
```

### Frontend Content

- Edit individual HTML files in `frontend/` to update content
- Update images in the `frontend/images/` folder
- Modify navigation links in each page's header

### Backend Configuration

- Update environment variables in `backend/.env`
- Add new routes in `backend/src/index.js`
- Configure middleware and database connections as needed

### Reusable Components

The `frontend/includes/` folder contains reusable HTML snippets:
- `header.html` - Navigation header
- `footer.html` - Footer section

Copy these into new pages to maintain consistency.
}
```

### Frontend Content

- Edit individual HTML files in `frontend/` to update content
- Update images in the `frontend/images/` folder
- Modify navigation links in each page's header

### Backend Configuration

- Update environment variables in `backend/.env`
- Add new routes in `backend/src/index.js`
- Configure middleware and database connections as needed

### Reusable Components

The `frontend/includes/` folder contains reusable HTML snippets:
- `header.html` - Navigation header
- `footer.html` - Footer section

Copy these into new pages to maintain consistency.

## Development

For detailed information about each part of the project, see:
- [Frontend Documentation](frontend/README.md)
- [Backend Documentation](backend/README.md)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

### Frontend
- Optimized CSS with minimal selectors
- Efficient JavaScript with event delegation
- Intersection Observer for scroll animations
- No external dependencies (pure vanilla JS)

### Backend
- Lightweight Express.js framework
- Minimal middleware overhead
- Scalable architecture for future expansion

---

**Note**: For detailed setup instructions and advanced configuration, refer to the README files in the `frontend/` and `backend/` directories.
