# Project implementation rules

- Keep release announcements in a newest-first, sortable-ID list and store only the most recently acknowledged ID on each profile; this keeps cross-device dismissal simple.- Keep initial and repeat push eligibility in the existing local-time nudge check; claim each nudge atomically in the database before sending so overlapping checks do not double-send.
- Record overdue Skip and Done through an authenticated database action so contact changes and engagement history stay together.
