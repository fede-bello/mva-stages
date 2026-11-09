// Remembers the board's query string and how many cards were shown, so "All offers" on an offer
// page returns to the same filtered list at the same length (scroll restoration needs the cards).
export const boardMemory = { search: '', shown: { key: '', n: 50 } }
