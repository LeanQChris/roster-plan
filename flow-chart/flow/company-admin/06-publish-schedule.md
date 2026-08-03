flowchart TD

A([Publish Schedule])

A --> B[Choose Date Range]

B --> C[Load Active Templates]

C --> D[Generate Shift Instances]

D --> E{Conflicts?}

E -->|Yes| F[Review Conflicts]
F --> G[Resolve Issues]
G --> D

E -->|No| H[Publish]

H --> I[Materialize Shifts]

I --> J[Notify Employees]

J --> K[Audit Log]

K --> L([Published])
