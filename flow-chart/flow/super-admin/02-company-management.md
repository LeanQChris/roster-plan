flowchart TD

A([Companies])

A --> B[List Companies]

B --> C{Select Company}

C --> D[View Details]

D --> E{Action}

E --> F[Suspend]
E --> G[Activate]
E --> H[Delete]

F --> I[Terminate Sessions]
G --> J[Restore Access]
H --> K[Soft Delete]

I --> L[Audit Log]
J --> L
K --> L

L --> M([Completed])
