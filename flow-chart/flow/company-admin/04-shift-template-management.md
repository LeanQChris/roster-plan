flowchart TD

A([Shift Templates])

A --> B{Action}

B --> C[Create Template]

C --> C1[Title]
C1 --> C2[Start Time]
C2 --> C3[Duration]
C3 --> C4[Staff Required]
C4 --> C5[Recurrence Rule]
C5 --> C6[Validate]
C6 --> C7[Save]

B --> D[Edit Template]
D --> D1[Modify Fields]
D1 --> D2[Save]

B --> E[Preview]
E --> E1[Generate Shifts]

B --> F[Delete Template]
F --> F1[Confirm Delete]
