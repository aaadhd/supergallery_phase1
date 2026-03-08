import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import Browse from './pages/Browse';
import WorkDetail from './pages/WorkDetail';
import RoomsDirectory from './pages/RoomsDirectory';
import RoomDetail from './pages/RoomDetail';
import RoomCreate from './pages/RoomCreate';
import RoomEdit from './pages/RoomEdit';
import LearnHome from './pages/LearnHome';
import ClassDetail from './pages/ClassDetail';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import SearchResults from './pages/SearchResults';
import Events from './pages/Events';
import SalesManagement from './pages/SalesManagement';
import Admin from './pages/Admin';
import ProductDetail from './pages/ProductDetail';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Browse },
      { path: 'browse', Component: Browse },
      { path: 'work/:id', Component: WorkDetail },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'rooms', Component: RoomsDirectory },
      { path: 'room/:id', Component: RoomDetail },
      { path: 'rooms/create', Component: RoomCreate },
      { path: 'rooms/edit', Component: RoomEdit },
      { path: 'learn', Component: LearnHome },
      { path: 'class/:id', Component: ClassDetail },
      { path: 'upload', Component: Upload },
      { path: 'profile', Component: Profile },
      { path: 'profile/:id', Component: Profile },
      { path: 'search', Component: SearchResults },
      { path: 'events', Component: Events },
      { path: 'sales', Component: SalesManagement },
      { path: 'admin', Component: Admin },
    ],
  },
]);