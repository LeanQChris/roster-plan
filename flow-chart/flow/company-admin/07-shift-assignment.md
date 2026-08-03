flowchart TD

A([Assign Employee])

A --> B[Select Shift]

B --> C[Choose Employee]

C --> D{Conflict?}

D -->|No| E[Assign]

D -->|Yes| F{Force Assign?}

F -->|No| G[Cancel]

F -->|Yes| E

E --> H[Save Assignment]

H --> I[Send Notification]

I --> J[Audit Log]
