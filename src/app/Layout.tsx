import { Outlet } from 'react-router-dom';
import { Header } from './components/Header';

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="-mt-0">
        <Outlet />
      </main>
    </div>
  );
}