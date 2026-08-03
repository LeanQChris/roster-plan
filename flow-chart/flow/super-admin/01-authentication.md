flowchart TD

A([Login])

A --> B[Enter Credentials]

B --> C{Valid?}

C -->|No| D[Show Error]

C -->|Yes| E[Detect Super Admin]

E --> F[Load Admin Dashboard]

F --> G([Ready])
