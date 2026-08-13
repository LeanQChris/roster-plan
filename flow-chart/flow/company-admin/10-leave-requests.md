flowchart TD

A([Leave Requests])

A --> B[Open All Requests Page]

B --> C[Apply Filters]

C --> D{Filter Type}

D -->|Team| E[Filter by Team]

D -->|Status| F[Filter by Status]

D -->|Date Range| G[Filter by Dates]

E --> H[Load Results]

F --> H

G --> H

H --> I[View Request Details]

I --> J[Requester, Team, Type]

I --> K[Dates, Reason]

I --> L[Status + Reviewer Comment]

L --> M([Done])