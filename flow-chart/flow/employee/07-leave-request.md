flowchart TD

A([Request Leave])

A --> B[Choose Type]

B --> C[Select Start Date]

C --> D[Select End Date]

D --> E[Add Reason]

E --> F[Submit Request]

F --> G{Valid Dates?}

G -->|No| H[Show Error]

G -->|Yes| I[Save as Pending]

I --> J[Status: Pending]

J --> K{Manager Decision}

K -->|Approved| L[Status: Approved]

K -->|Denied| M[Status: Denied]

L --> N[Email Received]

M --> O[Show Reviewer Comment]

N --> P([Done])

O --> P