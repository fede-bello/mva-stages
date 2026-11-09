import { lazy } from 'react'

// The board is in the main bundle (it is the landing page); the other pages load on demand.
export const Offer = lazy(() => import('./Offer'))
export const Submit = lazy(() => import('./Submit'))
export const Legal = lazy(() => import('./Legal'))
