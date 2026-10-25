import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'

export default function NotFound() {
  return (
    <PageHero
      image="pink-portrait"
      eyebrow="404"
      title={
        <>
          This page needs a <em className="text-glow">little glow up.</em>
        </>
      }
      text="We couldn't find what you were looking for, but your next appointment is only a tap away."
    >
      <Link to="/" className="btn btn-glow">
        Back to home
      </Link>
    </PageHero>
  )
}
