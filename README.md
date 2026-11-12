# Calorie Tracker

A lightweight, responsive daily calorie tracking web application built with vanilla HTML, CSS, and JavaScript.

## Features

- **Daily Calorie Tracking:** Log food entries with name, calorie count, and meal type (Breakfast, Lunch, Dinner, Snack).
- **Daily Target & Visual Progress:** Set and update a personal daily calorie target. A color-coded progress bar visually indicates your progress and warns if you exceed your target.
- **Meal Category Breakdown:** View calorie subtotals per meal type.
- **Date Navigation:** Browse past and future days with previous/next controls, jump directly to "Today", or use the date picker.
- **Full CRUD Support:** Add, edit (with active item highlighting), and delete entries (with confirmation).
- **Local Persistence:** All entries and daily goal settings are saved to browser `localStorage` and automatically restored on reload.
- **Accessible & Responsive:** Clean layout optimized for mobile and desktop screens with visible focus states and WCAG-compliant contrast.
- **Zero Dependencies:** Pure HTML5, CSS (with literal values, no frameworks or preprocessors), and vanilla JavaScript.

## Getting Started

No build tools or installation required. Simply open `index.html` in any modern web browser:

```bash
# Clone the repository
git clone https://github.com/Akinboni/<repo-name>.git

# Open index.html
start index.html
```

## Project Structure

```text
├── index.html    # Semantic structure and accessible markup
├── styles.css    # Responsive styling with literal CSS values
├── script.js     # State management, validation, and localStorage persistence
└── README.md     # Project documentation
```

