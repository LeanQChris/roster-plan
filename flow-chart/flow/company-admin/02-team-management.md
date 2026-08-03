flowchart TD

A([Team Management])

A --> B{Select Action}

B --> C[View Teams]

B --> D[Create Team]
D --> D1[Enter Name]
D1 --> D2[Choose Location]
D2 --> D3[Assign Manager]
D3 --> D4[Validate]
D4 --> D5[Create Team]

B --> E[Edit Team]
E --> E1[Modify Team]
E1 --> E2[Save]

B --> F[Delete Team]
F --> G{Has Members?}

G -->|Yes| H[Reassign Members]
H --> I[Confirm Delete]

G -->|No| I

I --> J[Delete Team]
J --> K[Audit Log]
