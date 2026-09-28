import MainViewShell from '@/layouts/MainViewShell';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <MainViewShell>{children}</MainViewShell>;
}