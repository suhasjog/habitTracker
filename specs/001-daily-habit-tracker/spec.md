# Feature Specification: Daily Habit Tracker

**Feature Branch**: `001-daily-habit-tracker`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "Allow each user to list 5-10 daily habits (such as yoga, meditation, self-care etc), record their activity on daily basis, send a reminder via app-notification if not done by 10PM, show a dashboard showing weekly monthly and yearly progress, reward them when there is at least a 3-days streak and nudge them when they miss it 2-days in a row, allow them to edit habits, record a small note (text/audio/video) along with each daily recorded activity, UI should be simple intuitive and engaging yet not overwhelming"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Habit Management (Priority: P1)

A user sets up their personal habit list by adding between 1 and 10 daily habits (e.g. "Morning Yoga", "Meditation", "Drink 8 glasses of water"). They can give each habit a name and optionally a short description. They can edit a habit name or description at any time, and remove habits they no longer want to track. The habit list is the foundation — without it, nothing else works.

**Why this priority**: Everything else depends on having habits defined. This is the setup phase every user must complete before they can track anything.

**Independent Test**: A user can open the app, create 3 habits, edit one, delete another, and be left with a saved list of habits — fully delivering the "personalized habit list" value.

**Acceptance Scenarios**:

1. **Given** a user has no habits, **When** they add a habit named "Yoga", **Then** "Yoga" appears in their habit list and persists when the app is closed and reopened.
2. **Given** a user has 10 habits, **When** they try to add an 11th, **Then** the system prevents it and shows a message explaining the 10-habit limit.
3. **Given** a user has a habit named "Meditate", **When** they edit the name to "Morning Meditation", **Then** the updated name is saved and shown immediately.
4. **Given** a user has a habit they no longer want, **When** they delete it, **Then** it is removed from their list and no longer appears in the daily check-in.
5. **Given** a user has 1 habit, **When** they try to navigate away without saving a new habit they started adding, **Then** the system discards the incomplete entry.

---

### User Story 2 - Daily Activity Check-In (Priority: P2)

Each day a user opens the app and sees their list of habits for today. They can mark each habit as "done" by tapping it. If they change their mind, they can unmark it. The check-in resets at midnight for a fresh day. This is the core daily loop of the app.

**Why this priority**: This is the primary daily interaction. A user can gain immediate value just from checking habits on/off — no dashboard, notes, or streaks needed.

**Independent Test**: A user can see today's habit list, mark 2 habits as done, close the app, reopen it, and see those 2 habits still marked as done.

**Acceptance Scenarios**:

1. **Given** a user opens the app on a new day, **When** they view the home screen, **Then** they see all their habits listed as uncompleted for today.
2. **Given** a user views their habits for today, **When** they tap a habit, **Then** it is immediately marked as completed with a clear visual indicator.
3. **Given** a user has marked a habit as done, **When** they tap it again, **Then** it reverts to uncompleted.
4. **Given** a user completed habits yesterday, **When** they open the app the next day, **Then** all habits appear fresh and uncompleted for the new day.
5. **Given** a user completes all habits for the day, **When** viewing the home screen, **Then** the app shows a celebratory completion state.

---

### User Story 3 - Activity Notes (Priority: P3)

When marking a habit as done, a user can optionally attach a small note to capture how it went — either as text, a short audio recording, or a short video clip. Notes are tied to that day's entry for that habit and can be viewed later.

**Why this priority**: Notes add depth to the daily check-in and are independently valuable as a journaling feature alongside habit tracking, but the app works without them.

**Independent Test**: A user can mark a habit as done, attach a text note saying "Felt great today", close the app, and later view that note against that day's entry.

**Acceptance Scenarios**:

1. **Given** a user marks a habit as done, **When** they choose to add a note, **Then** they are presented with options: text, audio, or video.
2. **Given** a user selects "text note", **When** they type and save a message, **Then** the note is saved and a note indicator appears on the habit entry.
3. **Given** a user selects "audio note", **When** they record and save a clip up to 60 seconds long, **Then** the recording is saved and playable from the habit entry.
4. **Given** a user selects "video note", **When** they record and save a short clip, **Then** the video is saved and viewable from the habit entry.
5. **Given** a habit entry has a note, **When** a user views it from the progress dashboard, **Then** the note is accessible and fully playable/readable.
6. **Given** a user does not want to add a note, **When** they mark a habit as done, **Then** they can skip the note step entirely.

---

### User Story 4 - Progress Dashboard (Priority: P4)

A user can navigate to a dashboard that shows how consistently they've completed each habit over time. The dashboard offers three views: weekly (last 7 days), monthly (last 30 days), and yearly (last 12 months). The data is presented visually in a simple and easy-to-read format.

**Why this priority**: The dashboard provides the motivational "payoff" for consistent tracking. It's independently testable with historical data and gives clear value for reflection.

**Independent Test**: A user with 2 weeks of check-in data can open the dashboard, switch between weekly, monthly, and yearly views, and see accurate completion data for each habit.

**Acceptance Scenarios**:

1. **Given** a user navigates to the dashboard, **When** the weekly view loads, **Then** they see each habit's completion status for each of the last 7 days.
2. **Given** a user is on the dashboard, **When** they switch to monthly view, **Then** they see a per-habit summary of completions for the last 30 days.
3. **Given** a user is on the dashboard, **When** they switch to yearly view, **Then** they see a per-habit monthly summary across the last 12 months.
4. **Given** a user has no data for a period, **When** viewing that period on the dashboard, **Then** the app shows an empty state with an encouraging message.
5. **Given** a user taps a specific day or period on the dashboard, **When** that entry has notes, **Then** they can access the notes from that view.

---

### User Story 5 - Streak Rewards & Nudges (Priority: P5)

The app automatically tracks each habit's consecutive-day completion streak. When a user completes a habit for 3 or more days in a row, they receive a celebratory reward (e.g., animation, congratulatory message). When a user has missed a habit for 2 days in a row, they receive a gentle nudge encouraging them to get back on track.

**Why this priority**: Streak mechanics are a powerful motivational tool but require historical check-in data to work. They enhance the experience but the app delivers value without them.

**Independent Test**: A user who has completed "Yoga" 3 days running sees a reward on the 3rd day. A user who missed "Meditation" for 2 consecutive days sees a nudge message.

**Acceptance Scenarios**:

1. **Given** a user completes a habit for exactly 3 consecutive days, **When** they complete it on the 3rd day, **Then** a reward (animation or congratulatory message) is shown immediately.
2. **Given** a user has a 5-day streak on a habit, **When** they complete it again, **Then** the reward continues to show (the reward applies for all streaks ≥ 3 days).
3. **Given** a user missed a habit for 2 consecutive days, **When** they open the app on the 3rd day, **Then** a gentle nudge message is shown for that habit.
4. **Given** a user sees a nudge and then completes the habit, **When** they mark it done, **Then** the nudge is dismissed and the streak resets from day 1.
5. **Given** a user has streaks across multiple habits, **When** viewing the home screen or dashboard, **Then** each habit's current streak count is visible.

---

### User Story 6 - 10PM Reminder Notifications (Priority: P6)

At 10PM each day, for any habit not yet completed that day, the app sends a push notification reminding the user to complete it. Notifications are only sent for habits that have not already been marked done. Users can opt out of notifications.

**Why this priority**: Reminders require notification permission and OS-level scheduling, which adds complexity. Core tracking works without them; they are a behavioral reinforcement layer.

**Independent Test**: A user grants notification permission, leaves one habit uncompleted, and at 10PM receives a notification referencing that specific habit.

**Acceptance Scenarios**:

1. **Given** a user has not completed a habit by 10PM, **When** 10PM arrives, **Then** the app sends a push notification mentioning that habit by name.
2. **Given** a user has already completed all habits before 10PM, **When** 10PM arrives, **Then** no reminder notification is sent.
3. **Given** a user has completed some but not all habits before 10PM, **When** 10PM arrives, **Then** a notification is sent only for the uncompleted habits.
4. **Given** a user has not granted notification permission, **When** they first open the app, **Then** the app asks for notification permission with a clear explanation of why it's useful.
5. **Given** a user opts out of notifications, **When** 10PM arrives, **Then** no notification is sent regardless of completion status.

---

### Edge Cases

- What happens when a user tries to add more than 10 habits? System must block the addition and explain the limit.
- What happens if the user changes their device timezone? Reminders and daily resets should follow device local time.
- What if the app is not installed or notification permission is denied? 10PM reminders cannot be delivered; the app should surface this limitation clearly.
- What if a user has no habits? The home screen should show an encouraging empty state prompting them to add their first habit.
- What happens to notes if a habit is deleted? Notes tied to the deleted habit should be removed along with all its historical data.
- What if the user tries to record an audio/video note but denies microphone/camera permission? The app must gracefully handle the denial and fall back to text-only notes.
- What if a user opens the app past midnight after completing all habits the previous evening? The new day's slate should appear fresh and uncompleted.
- What happens to streak counts when a habit is edited (name change only)? Streak is preserved. If a habit is deleted and re-added, streak resets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to add between 1 and 10 daily habits.
- **FR-002**: System MUST allow each habit to have a name (required) and an optional short description.
- **FR-003**: System MUST prevent adding more than 10 habits and display an informative message when the limit is reached.
- **FR-004**: System MUST allow users to edit a habit's name and description at any time.
- **FR-005**: System MUST allow users to delete a habit, removing it and all associated historical data.
- **FR-006**: System MUST display all habits for the current day as the primary home screen view.
- **FR-007**: System MUST allow users to mark a habit as completed for the current day.
- **FR-008**: System MUST allow users to unmark a habit completion within the same day.
- **FR-009**: System MUST reset each habit's daily completion status at midnight local time.
- **FR-010**: System MUST allow users to optionally attach a note (text, audio up to 60 seconds, or video up to 30 seconds) to any daily habit entry.
- **FR-011**: System MUST allow audio and video notes to be played back from within the app.
- **FR-012**: System MUST send a push notification at 10:00 PM local time for each habit not yet completed that day.
- **FR-013**: System MUST NOT send a 10PM reminder for habits already marked as completed.
- **FR-014**: System MUST request notification permission from users, with a clear explanation of the purpose.
- **FR-015**: System MUST allow users to opt out of notifications, either at the OS level or within the app.
- **FR-016**: System MUST display a progress dashboard with weekly (7-day), monthly (30-day), and yearly (12-month) views.
- **FR-017**: System MUST show per-habit completion data in all dashboard views.
- **FR-018**: System MUST track each habit's consecutive-day completion streak.
- **FR-019**: System MUST display a reward (animation or congratulatory message) when a habit reaches a 3-day streak or higher.
- **FR-020**: System MUST display a gentle nudge message when a habit has been missed for 2 consecutive days.
- **FR-021**: System MUST display each habit's current streak count on the home screen and dashboard.
- **FR-022**: System MUST support multiple users via account creation and login (email and password), with each user's habits and history stored independently.
- **FR-023**: System MUST provide an encouraging empty state when the user has no habits configured.
- **FR-024**: System MUST use a UI that is visually simple, engaging, and uncluttered — with at most 3 primary navigation areas.

### Key Entities

- **Habit**: A recurring daily activity with a name, optional description, and creation date. Belongs to a user. Has at most 10 per user.
- **Daily Entry**: A record that a specific habit was completed on a specific date. Has a completion timestamp and an optional attached note.
- **Note**: An optional attachment on a Daily Entry. Can be text (plain string), audio (recorded clip), or video (recorded clip). Stores capture date and media type.
- **Streak**: Derived from Daily Entries — the count of consecutive days a habit has been completed without a gap. Calculated per habit.
- **Notification**: A scheduled reminder tied to a specific uncompleted habit, sent at 10PM local time if the habit is not yet done.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add their first habit and complete their first daily check-in within 2 minutes of opening the app for the first time.
- **SC-002**: All of today's habits are visible on the home screen without any scrolling for users with up to 10 habits on a standard mobile screen.
- **SC-003**: Streak rewards and nudge messages appear within 1 second of the qualifying action (completing a habit or opening the app after a 2-day miss).
- **SC-004**: The progress dashboard loads and displays accurate data within 2 seconds of navigation for a user with up to 1 year of check-in history.
- **SC-005**: 10PM reminders are delivered within a 5-minute window of the scheduled time when notification permission has been granted.
- **SC-006**: Users can complete the daily check-in (mark all habits as done) in under 60 seconds on a typical day.
- **SC-007**: The app functions fully offline for habit management, daily check-ins, and dashboard viewing (notifications excluded).
- **SC-008**: Note attachment (text) can be completed in under 30 seconds per habit entry.
- **SC-009**: At least 80% of first-time users can locate and use the progress dashboard without any guidance or tutorial.

## Assumptions

- **A-001**: The app targets mobile web or a mobile-first web experience (Progressive Web App) given the existing React + Vite setup. Native mobile notification support may be limited to browsers that support the Web Push API.
- **A-002**: A "day" is defined by the user's local device timezone midnight-to-midnight.
- **A-003**: Streaks are tracked per individual habit, not across all habits simultaneously.
- **A-004**: Editing a habit's name preserves its historical data and streak.
- **A-005**: Audio notes are capped at 60 seconds; video notes are capped at 30 seconds per entry.
- **A-006**: The 10PM reminder time (10:00 PM) is fixed and not configurable per user in this version.
- **A-007**: Historical data (check-ins and notes) for deleted habits is also permanently deleted.
- **A-008**: The habit limit of 10 is a hard maximum; the minimum recommended is 1 (not enforced as a minimum).
- **A-009**: Rewards (streaks) and nudges are shown in-app as UI elements, not as separate push notifications.
