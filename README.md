# Zonta Club of Naples Website

A modern, responsive multi-page website for the Zonta Club of Naples, built with clean HTML, CSS, and JavaScript.

## Project Structure

```
zonta/
├── index.html              # Homepage
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   |-- main.js             # Main JavaScript file
|   └── nav-footer-share.js # Manage the shared header and footer
├── pages/
│   ├── about.html          # About page
│   ├── service.html        # Service page
│   ├── advocacy.html       # Advocacy page
│   ├── scholarships.html   # Scholarships page
│   ├── membership.html     # Membership page
│   └── action.html         # Zonta in Action page
├── includes/
│   ├── header.html         # Reusable header component
│   └── footer.html         # Reusable footer component
└── images/                 # Image assets
    ├── zonta-logo.png
    ├── zonta-100-years.png
    ├── historic-group.jpg
    ├── current-group.jpg
    ├── about-collage.jpg
    ├── meeting-flyer.jpg
    ├── qa-image.jpg
    ├── icon-hand.png
    ├── icon-scales.png
    └── icon-gavel.png
```

## Features

- ✅ **Fully Responsive**: Works on all devices (desktop, tablet, mobile)
- ✅ **Modern Design**: Clean, professional layout with smooth animations
- ✅ **Multi-Page Architecture**: Separate pages for different sections
- ✅ **Mobile Navigation**: Hamburger menu for mobile devices
- ✅ **Smooth Scrolling**: Enhanced user experience with smooth scroll effects
- ✅ **Intersection Observer**: Animated elements on scroll
- ✅ **Counter Animation**: Animated statistics counters
- ✅ **Modular Structure**: Separated HTML, CSS, and JavaScript

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A web server (optional, for local development)

### Installation

1. Clone or download this repository
2. Open `index.html` in your web browser, or
3. Use a local development server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

4. Navigate to `http://localhost:8000` in your browser

## Pages

- **Home** (`index.html`): Landing page with hero section, services overview, and statistics
- **Who We Are** (`pages/about.html`): Organization history, mission, and values
- **Service** (`pages/service.html`): Community service initiatives
- **Advocacy** (`pages/advocacy.html`): Service areas and advocacy work
- **Scholarships** (`pages/scholarships.html`): Available scholarships and applications
- **Membership** (`pages/membership.html`): Membership benefits and application
- **Zonta in Action** (`pages/action.html`): Meetings, events, and FAQ

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

### Reusable Components

The `includes/` folder contains reusable HTML snippets:
- `header.html` - Navigation header
- `footer.html` - Footer section

Copy these into new pages to maintain consistency.

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

---

**Note**: This is a static website. For dynamic content management, consider integrating a CMS like WordPress, or use server-side includes (SSI) to automatically include header/footer components.
