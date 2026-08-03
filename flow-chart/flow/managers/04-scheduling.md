flowchart TD

A([Schedule])

A --> B[Select Week]

B --> C{Action}

C --> D[Create Shift]

C --> E[Edit Shift]

C --> F[Delete Shift]

C --> G[Publish]

G --> H[Generate Shifts]

H --> I[Notify Employees]

I --> J([Done])
