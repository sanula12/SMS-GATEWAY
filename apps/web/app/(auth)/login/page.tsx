import { Metadata } from 'next';
import LoginForm from '../../../components/public/loginform';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Enter your credentials to access the dashboard.',
};

export default function LoginPage() {
  return (
    <main>
      <LoginForm />
    </main>
  );
}
