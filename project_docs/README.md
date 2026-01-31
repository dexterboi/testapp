# Project Documentation

This directory contains all project documentation for PitchPerfect with an **interactive documentation portal**.

## 🌐 Documentation Portal

Access the interactive documentation hub:
```
file:///Users/wasseflabidi/Documents/ai projects/pitchperfect/project_docs/index.html
```

### Features

- **Interactive Force-Directed Graph** - D3.js visualization showing system architecture as connected nodes
- **Multi-Page Navigation** - Dedicated pages for each documentation section
- **Premium Design** - Consistent with PitchPerfect branding
- **Real-time Markdown Rendering** - Documentation loaded dynamically

## 📁 Structure

```
project_docs/
├── index.html                      ← Main documentation hub with interactive graph
├── pages/
│   ├── architecture.html           ← System architecture details
│   ├── roadmap.html                ← Project roadmap and status
│   ├── mobile.html                 ← Mobile app strategy
│   └── stores.html                 ← App store submission guide
├── architecture.md                 ← Architecture documentation (source)
├── roadmap.md                      ← Roadmap documentation (source)
├── academy_mobile_app_plan.md      ← Mobile app plan (source)
├── store_submission_guide.md       ← Store guide (source)
└── task_board.md                   ← Task tracking
```

## 🎯 Interactive Graph

The main hub features an interactive force-directed graph that visualizes:
- **Frontend nodes** (yellow) - Web pages and mobile apps
- **Backend nodes** (blue) - Supabase services
- **Integration nodes** (purple) - Third-party services

**Interactions:**
- Click nodes to highlight connections and navigate to detailed documentation
- Drag nodes to rearrange the layout
- Reset button to restore default view

## 📄 Documentation Pages

Each page loads its corresponding markdown file and renders it with:
- Syntax-highlighted code blocks
- Styled tables and lists
- Mermaid diagrams (where applicable)
- Consistent navigation

## 🔄 Updating Documentation

1. Edit the markdown files in this directory
2. Changes are automatically reflected when you reload the HTML pages
3. No build step required!

## 🎨 Design System

- **Primary Color**: #D9FF66 (Lime Green)
- **Background**: #020617 (Dark Blue)
- **Typography**: Outfit (Display), Inter (Body)
- **Components**: Glass morphism, rounded corners, smooth animations
