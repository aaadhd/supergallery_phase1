import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

// artier - 디지털 드로잉 갤러리 플랫폼
export default function App() {
  return <RouterProvider router={router} />;
}