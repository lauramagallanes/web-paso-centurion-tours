export const routes = {
    home: "/",
    contact: "/contact-us",
    accomodations: "/accomodations",
    about: "/about",
    activities: "/activities",
    activityDetails: "/actividades/:id",
    birdDetail: "/bird/:id",
    book: "/book",
    bookings: "/bookings",
    myBookings: "/my-bookings",
    // Admin routes
    admin: "/admin",
    adminReservations: "/admin/reservations",
    adminRooms: "/admin/rooms",
    adminTrails: "/admin/trails",
    adminGuides: "/admin/guides",
    login: "/login"
} as const;

export type RouteKey = keyof typeof routes; 