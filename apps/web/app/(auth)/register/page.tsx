import { Metadata } from 'next';
import RegisterForm from '../../../components/public/registerform';

export const metadata: Metadata = {
  title: 'Register - V-SMS',
  description: 'Create an account to start using V-SMS.',
};

export default function RegisterPage() {
  return (
    <main>
      <RegisterForm />
    </main>
  );
}
