flowchart TD

A([Clock In])

A --> B{Assigned Shift?}

B -->|No| C[Show Error]

B -->|Yes| D[Record Start Time]

D --> E[Working]

E --> F[Clock Out]

F --> G[Optional Notes]

G --> H[Calculate Duration]

H --> I[Save Entry]

I --> J([Completed])
