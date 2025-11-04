# Zonta Club of Naples - Frontend

Modern, responsive multi-page website for the Zonta Club of Naples, built with clean HTML, CSS, and JavaScript.

## Structure

```
frontend/
├── index.html              # Homepage
├── css/
│   ├── styles.css          # Main stylesheet
│   └── shop.css            # Shop page styles
├── js/
│   ├── main.js             # Main JavaScript file
│   ├── nav-footer-share.js # Manage the shared header and footer
│   └── shop.js             # Shop page functionality
├── pages/
│   ├── about.html          # About page
│   ├── service.html        # Service page
│   ├── advocacy.html       # Advocacy page
│   ├── scholarships.html   # Scholarships page
│   ├── membership.html     # Membership page
│   ├── events.html         # Events page
│   └── shop.html           # Shop page
├── includes/
│   ├── header.html         # Reusable header component
│   └── footer.html         # Reusable footer component
└── images/                 # Image assets
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A web server (optional, for local development)

### Running Locally

1. Use a local development server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

2. Navigate to `http://localhost:8000` in your browser

## Features

- ✅ **Fully Responsive**: Works on all devices (desktop, tablet, mobile)
- ✅ **Modern Design**: Clean, professional layout with smooth animations
- ✅ **Multi-Page Architecture**: Separate pages for different sections
- ✅ **Mobile Navigation**: Hamburger menu for mobile devices
- ✅ **Smooth Scrolling**: Enhanced user experience with smooth scroll effects
- ✅ **Intersection Observer**: Animated elements on scroll
- ✅ **Counter Animation**: Animated statistics counters
- ✅ **Modular Structure**: Separated HTML, CSS, and JavaScript

## Customization

### Colors

Edit the CSS variables in `css/styles.css`:

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

### Content

- Edit individual HTML files to update content
- Update images in the `images/` folder
- Modify navigation links in each page's header

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Optimized CSS with minimal selectors
- Efficient JavaScript with event delegation
- Intersection Observer for scroll animations
- No external dependencies (pure vanilla JS)
