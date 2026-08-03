flowchart TD

A([Invite Employee])

A --> B[Enter Email]

B --> C[Select Role]

C --> D[Assign Team]

D --> E[Validate]

E -->|Invalid| F[Show Errors]

E -->|Valid| G[Send Invitation]

G --> H[Audit Log]

H --> I([Completed])
