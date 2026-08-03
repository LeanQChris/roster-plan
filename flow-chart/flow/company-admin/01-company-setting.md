flowchart TD

A([Company Settings])

A --> B[View Current Settings]

B --> C{Choose Action}

C --> D[Edit Timezone]
C --> E[Edit Branding]
C --> F[Edit Locale]

D --> G[Validate]
E --> G
F --> G

G -->|Valid| H[Save Changes]
G -->|Invalid| I[Show Validation Errors]

H --> J[Update Database]
J --> K[Audit Log]
K --> L[Settings Updated]
