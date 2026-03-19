import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import Browse from './pages/Browse';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Events from './pages/Events';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Browse },
      { path: 'browse', Component: Browse },
      { path: 'upload', Component: Upload },
      { path: 'profile', Component: Profile },
      { path: 'profile/:id', Component: Profile },
      { path: 'events', Component: Events },
    ],
  },
]);
