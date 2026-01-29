# System Architecture

This document describes the high-level architecture of the PitchPerfect ecosystem, including the current Web/Mobile components and the shared backend.

## Framework Overview

```mermaid
graph TD
    subgraph "Clients"
        WebClient["Web Discovery & Booking (HTML/JS)"]
        OwnerDash["Owner Management Portal (HTML/JS)"]
        MobileApp["Current React Native App (Expo)"]
        subgraph "New Components"
            AcademyApp["New Academy Mobile App (Plan)"]
        end
    end

    subgraph "Backend (Supabase)"
        DB[("Postgres Database")]
        Auth["Supabase Auth"]
        Storage["Supabase Storage (Logos/Photos)"]
        Edge["Edge Functions (Integrations)"]
    end

    subgraph "Third Party"
        ImageKit["ImageKit.io (Image Optimization)"]
        GoogleMaps["Google Maps API"]
    end

    %% Relationships
    WebClient --> DB
    WebClient --> Auth
    OwnerDash --> DB
    OwnerDash --> Storage
    OwnerDash --> ImageKit
    MobileApp --> DB
    MobileApp --> Auth
    AcademyApp --> DB
    AcademyApp --> Auth
    
    %% Communication
    DB <--> Auth
    DB <--> Edge
```

## Data Model (Core Entities)

```mermaid
classDiagram
    class Complexes {
        +UUID id
        +String name
        +Point location
    }
    class Academies {
        +UUID id
        +UUID complex_id
        +String name
        +JSON config
    }
    class Programs {
        +UUID id
        +UUID academy_id
        +String name
        +Integer price
    }
    class Students {
        +UUID id
        +UUID academy_id
        +String name
        +Date payment_expiration
    }
    class Registrations {
        +UUID id
        +UUID academy_id
        +String status
    }

    Complexes "1" -- "*" Academies
    Academies "1" -- "*" Programs
    Academies "1" -- "*" Students
    Academies "1" -- "*" Registrations
```

## Key Flows

1. **Discovery**: Users browse `academies.html` -> Query Supabase `academies` joined with `complexes`.
2. **Registration**: Guest fills form -> Insert into `academy_registrations`.
3. **Management**: Owner views dashboard -> Manages students, coaches, and schedules via `academy_mgmt`.
