flowchart TD

A([Assignment])

A --> B[Select Shift]

B --> C[Choose Employee]

C --> D{Conflict?}

D -->|No| E[Assign]

D -->|Yes| F[Override?]

F -->|Yes| E

F -->|No| G[Cancel]

E --> H[Save]

H --> I[Send Notification]

I --> J([Completed])
