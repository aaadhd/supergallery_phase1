import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { works } from '../data';
import { groupWorks } from '../groupData';
import { workStore } from '../store';
import { WorkDetailModal } from '../components/WorkDetailModal';

export default function WorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // works(정적) + workStore(동적) + groupWorks 모두에서 찾기
  const allWorks = [...workStore.getWorks(), ...works, ...groupWorks];
  // 중복 ID 제거 (workStore가 우선)
  const uniqueWorks = allWorks.filter((w, idx, arr) => arr.findIndex(x => x.id === w.id) === idx);
  const work = uniqueWorks.find(w => w.id === id);

  useEffect(() => {
    if (!work) {
      // 작품을 찾을 수 없으면 Browse 페이지로 리다이렉트
      navigate('/browse');
    }
  }, [work, navigate]);

  if (!work) {
    return null;
  }

  const handleClose = () => {
    // 모달을 닫으면 이전 페이지로 이동하거나 Browse로 이동
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/browse');
    }
  };

  const handleNavigate = (workId: string) => {
    navigate(`/work/${workId}`);
  };

  return (
    <WorkDetailModal
      workId={id!}
      onClose={handleClose}
      onNavigate={handleNavigate}
      allWorks={uniqueWorks}
    />
  );
}
