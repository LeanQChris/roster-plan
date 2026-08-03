flowchart TD

A([Platform Audit])

A --> B[Open Audit Log]

B --> C[Filter]

C --> D[Actor]

C --> E[Company]

C --> F[Date]

C --> G[Action]

D --> H[Display Records]
E --> H
F --> H
G --> H

H --> I[Expand Details]

I --> J([Done])
