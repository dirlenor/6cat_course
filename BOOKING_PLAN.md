# 6CAT Academy — Simple Booking Plan

Status: Planning only — do not implement until the landing page and booking details are ready.

## Goal

Let customers select a package, an available workshop day, and a location; collect their contact details; then accept manual QR payment confirmation through LINE without Stripe.

## Customer flow

```text
Choose package → choose available date → choose location → enter contact details
→ temporarily reserve the date → show QR and payment amount
→ add LINE + copy payment message → customer sends the message and slip in LINE
→ admin verifies the payment → permanently lock the date
```

### 1. Package selection

- SOLO: 3,999 THB
- BUDDY: 5,999 THB
- Every booking CTA opens the booking flow.
- SOLO and BUDDY CTAs preselect their respective package.

### 2. Select date and location

- Customers only see dates and times that the admin has marked as available.
- Customers choose from admin-managed locations.
- A location may optionally carry an additional travel fee.
- The booking summary always shows the final package, date, location, and amount before payment.

### 3. Customer information

Required fields:

- First and last name
- Phone number
- LINE ID
- Email address
- Any booking note

### 4. QR payment and LINE handoff

- Show the configured PromptPay or bank-account QR image with the required payment amount.
- Provide an **Add LINE** button that opens the 6CAT LINE Official Account add-friend link.
- Provide a **Copy payment message** button. Customers paste this message into the LINE chat and attach their transfer slip there.
- The initial version does not upload slips to the website.

Example copied message:

```text
แจ้งชำระค่า Workshop 6CAT
รหัสจอง: 6CAT-XXXX
แพ็กเกจ: BUDDY
วันที่เรียน: …
สถานที่: …
ยอดโอน: 5,999 บาท
ชื่อผู้จอง: …
```

## Booking statuses

| Status | Meaning | Availability shown to customers |
| --- | --- | --- |
| `pending_payment` | Booking submitted; customer is expected to pay | Held temporarily |
| `payment_submitted` | Customer has notified the team and sent a slip in LINE | Held temporarily |
| `confirmed` | Admin verified the payment | Permanently unavailable |
| `cancelled` | Admin cancelled or the payment hold expired | Available again |

## Admin back office

The admin-only back office should provide:

- Available-date management: create, edit, close, or reopen workshop slots.
- Location management: name, description, and optional travel fee.
- Booking list with package, customer details, chosen slot, location, price, and status.
- Actions to mark payment submitted, confirm payment, or cancel a booking.
- Confirming payment permanently locks the corresponding workshop slot.
- Cancelling a booking releases the slot.

## Data and notifications

- A database is the source of truth for slots and bookings, so two customers cannot claim the same date.
- Google Sheet receives a copied/synced booking record for easy operational tracking; it is not the source of truth for availability.
- Send the admin an email when a booking is submitted and when it is confirmed.
- Customer-facing personal data and admin actions must be restricted to authenticated administrators.

## Suggested technical scope

- Existing landing page: booking modal or dedicated booking page.
- Small admin back office with authenticated access.
- Database for `booking_slots`, `locations`, and `bookings`.
- Secure QR image configuration and LINE add-friend URL configuration.
- Google Sheet sync and admin email notifications.

## Decisions required before implementation

1. How long should a `pending_payment` booking hold a date before it expires?
2. Which PromptPay or bank QR should be shown?
3. What is the LINE Official Account add-friend URL?
4. Which dates/times and locations should be available at launch?
5. Which locations have an additional travel fee, if any?
6. Which email address should receive booking notifications?

