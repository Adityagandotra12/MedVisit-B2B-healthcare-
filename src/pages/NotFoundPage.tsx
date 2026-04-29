import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';

export default function NotFoundPage() {
  return (
    <section className="auth-shell">
      <Card className="login-card">
        <h2>Page not found</h2>
        <p style={{ marginBottom: '1rem' }}>
          The requested route does not exist in this workspace.
        </p>
        <Link to="/dashboard">Go to dashboard</Link>
      </Card>
    </section>
  );
}
