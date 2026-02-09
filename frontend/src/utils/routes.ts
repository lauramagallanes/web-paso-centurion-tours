export const routes = {
    home: "/",
    contact: "/contact-us",
    accomodations: "/accomodations",
    alojamientos: "/alojamientos",
    alojamientoDetails: "/alojamientos/:id",
    about: "/about",
    activities: "/activities",
    activityDetails: "/actividades/:id",
    birdDetail: "/bird/:id",
    birding: "/birding",
    birdwatching: "/birdwatching",
    book: "/book",
    bookings: "/bookings",
    myBookings: "/my-bookings",
    // Checkout & Payment routes
    checkout: "/checkout",
    paymentResult: "/pago/resultado",
    paymentCancelled: "/pago/cancelado",
    // Admin routes
    admin: "/admin",
    adminReservations: "/admin/reservations",
    adminRooms: "/admin/rooms",
    adminTrails: "/admin/trails",
    adminGuides: "/admin/guides",
    adminAlojamientos: "/admin/alojamientos",
    login: "/login"
} as const;

export type RouteKey = keyof typeof routes; 