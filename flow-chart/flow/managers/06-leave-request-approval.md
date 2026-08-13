flowchart TD

A([Leave Requests])

A --> B[Select Team]

B --> C{Manage This Team?}

C -->|No| D[Access Denied]

C -->|Yes| E[View Pending Requests]

E --> F[Select Request]

F --> G{Decision}

G -->|Approve| H[Add Optional Comment]

G -->|Deny| I[Add Comment]

H --> J[Status: Approved]

I --> K[Status: Denied]

J --> L[Save reviewed_by + reviewed_at]

K --> M[Save reviewer_comment]

L --> N[Email Employee]

M --> N

N --> O([Done])