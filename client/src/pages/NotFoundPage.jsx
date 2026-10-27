import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page">
      <div className="empty-state card">
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary">
          Back to dashboard
        </Link>
      </div>
    </section>
  );
}
