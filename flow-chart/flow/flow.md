flowchart TD

A([User Opens Roster])
B{Select Role}

A --> B

B --> SA[Super Admin]
B --> CA[Company Admin]
B --> M[Manager]
B --> E[Employee]

SA --> SA1[Manage Companies]
SA1 --> SA2[View Audit Logs]
SA2 --> SA3[Logout]

CA --> CA1[Company Settings]
CA1 --> CA2[Manage Teams]
CA2 --> CA3[Manage People]
CA3 --> CA4[Manage Shift Templates]
CA4 --> CA5[Schedule Shifts]
CA5 --> CA6[Publish Schedule]
CA6 --> CA7[Compliance]
CA7 --> CA8[Logout]

M --> M1[View Teams]
M1 --> M2[Manage Team Members]
M2 --> M3[Manage Templates]
M3 --> M4[Schedule Shifts]
M4 --> M5[Assign Employees]
M5 --> M6[View Clock Entries]
M6 --> M7[Logout]

E --> E1[View Schedule]
E1 --> E2[Clock In]
E2 --> E3[Clock Out]
E3 --> E4[View Clock History]
E4 --> E5[Update Profile]
E5 --> E6[Logout]
