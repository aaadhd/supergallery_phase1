import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationSettings() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/settings#notifications', { replace: true });
  }, [navigate]);

  return null;
}
