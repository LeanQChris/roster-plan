flowchart TD

A([People])

A --> B{Action}

B --> C[View People]

B --> D[Invite Person]
D --> D1[Enter Email]
D1 --> D2[Select Role]
D2 --> D3[Assign Team]
D3 --> D4[Send Invite]
D4 --> D5[Email Sent]

B --> E[View Profile]

B --> F[Edit Person]
F --> F1[Update Details]
F1 --> F2[Save]

B --> G[Resend Invite]
G --> G1[Email Sent]

F2 --> H[Audit Log]
