flowchart TD

A([Schedule])

A --> B{Action}

B --> C[View Schedule]

B --> D[Create Shift]
D --> D1[Select Date]
D1 --> D2[Set Time]
D2 --> D3[Assign Team]
D3 --> D4[Save]

B --> E[Edit Shift]
E --> E1[Modify Shift]
E1 --> E2[Save]

B --> F[Delete Shift]
F --> F1[Confirm]
F1 --> F2[Delete]

B --> G[View Shift Details]
