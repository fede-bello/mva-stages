import { createBrowserRouter } from 'react-router'
import Board from './pages/Board'
import { Legal, Offer, Submit } from './pages/lazy'
import NotFound from './pages/NotFound'
import Root from './Root'
import RouteError from './RouteError'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    errorElement: <RouteError />,
    children: [
      { index: true, Component: Board },
      { path: 'offer/:slug', Component: Offer },
      { path: 'submit', Component: Submit },
      { path: 'legal', Component: Legal },
      { path: '*', Component: NotFound },
    ],
  },
])
