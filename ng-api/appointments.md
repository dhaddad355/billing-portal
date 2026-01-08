## Appointment Status

What is the difference between Appointment status and workflowStatus?
Each appointment will only have one of the canonical statuses below at any given time; the applicable canonical status is determined by the combination of the true/false values of isKept, isRescheduled, isCancelled, and isNoShow as detailed below.

*Expected - The appointment is scheduled for today or a future date. The following appointment field values equate to this status:
{appointmentId} exists
isKept=false
isRescheduled=false
isCanceled=false
isNoShow=false

Kept - The appointment has been flagged as Kept because it has gone through the check-in/encounter creation process (via PM user action in the UI or API PUT /appointment/{appointmentId}/kept route), or a PM user has manually set the "Appointment Kept" checkbox. The following API field values equate to this status:
{appointmentId} exists
isKept=true
isRescheduled=false
isCanceled=false
isNoShow=false

Canceled - The appointment was canceled, either by a user in the NextGen Enterprise Practice Management (or "PM") UI, or via API using POST /appointments/{appointmentId}/cancel. The following API field values equate to this status:
{appointmentId} exists
isKept=false
isRescheduled=false
isCanceled=true
isNoShow=false

No Show - The canonical appointment status automatically changes to No Show if the following criteria are met, in which case the isNoShow field value for the appointment is changed to "isNoShow": true. The current time is after midnight (NGE server time) of the date for which the appointment was scheduled
isKept=false
isRescheduled=false
isCanceled=false
isNoShow=true

The workflowStatus property of an appointment is a different and separate status that should not be confused nor conflated with the canonical statuses above.
The current value of the "workflowStatus": "<string>" field of a given appointment can be obtained using API via a GET request, but cannot be set via POST nor altered via PUT or PATCH.

Clients who choose to utilize the workflowStatus field may do so to enable custom, client-configured appointment statuses for use in the Appointments tab of the EHR Workflow module and in the PM appointment book.

Clients may customize their own workflow status pick list, assign a custom color to each value, and/or choose to enable display of these custom color to represent the workflow status of an appointment in the Appointments tab of the EHR Workflow module and in the PM appointment book.

Since workflowStatus is customizable per client environment, it is not advisable to rely on workflowStatus values for integration functions unless a given client confirms which, if any, of their workflowStatus values equate to one of the canonical, non-custom appointment statuses detailed above.
It is up to API developers as to the degree of support to offer for workflowStatus values that do not directly and exclusively correspond to one of the canonical, non-custom appointment statuses.

There is no programmatic method to obtain all possible workflowStatus values for a given Practice. Developers interested in utilizing workflowStatus should discuss this with each mutual client to learn about each value that might be in use, and if/how each relates to the canonical statuses.
