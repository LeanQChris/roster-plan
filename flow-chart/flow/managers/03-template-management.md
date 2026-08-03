flowchart TD

A([Templates])

A --> B{Action}

B --> C[Create]

B --> D[Edit]

B --> E[Delete]

C --> F[Fill Template]

F --> G[Save]

D --> G

E --> H[Confirm]

H --> I[Delete]

G --> J[Audit]

I --> J
