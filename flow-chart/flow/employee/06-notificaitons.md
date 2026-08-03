flowchart TD

A([Notifications])

A --> B[Open Notification]

B --> C[Read]

C --> D{Action}

D --> E[Mark Read]

D --> F[Mark All Read]

E --> G([Done])

F --> G
