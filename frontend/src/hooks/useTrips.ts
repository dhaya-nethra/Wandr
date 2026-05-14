/**
 * useTrips — thin re-export so existing imports keep working.
 *
 * All trip state now lives in TripsContext (singleton per app session).
 * This means deleting a trip on TripHistory immediately updates the
 * stats shown on Dashboard, because both pages share the same state.
 */
export { useTripsContext as useTrips } from '@/context/TripsContext';