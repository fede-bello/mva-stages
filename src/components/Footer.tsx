import { Link } from 'react-router'
import { REPO_URL } from '../lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-board flex-wrap gap-x-6 gap-y-2 px-6 py-5 text-[13px] text-muted">
        <span>Run by MVA students, not by the program. Not an official ENS Paris-Saclay service.</span>
        <Link to="/submit">Add an offer</Link>
        <Link to="/legal#contact">Report a mistake</Link>
        <Link to="/legal">Legal notice and contact</Link>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          Source code on GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </footer>
  )
}
