import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { workStore } from '../store';
import { Work } from '../data';
import { Button } from '../components/ui/button';

export default function Admin() {
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    // 초기 로드 및 변경사항 구독
    const updateWorks = () => {
      setWorks(workStore.getWorks());
    };
    
    updateWorks();
    const unsubscribe = workStore.subscribe(updateWorks);
    
    return unsubscribe;
  }, []);

  // 판매 심사 요청 중인 작품
  const requestedWorks = works.filter(w => w.saleStatus === 'requested');

  const handleApprove = (workId: string) => {
    if (confirm('이 작품의 판매를 승인하시겠습니까?')) {
      workStore.approveSale(workId);
      alert('판매가 승인되었습니다!');
    }
  };

  const handleReject = (workId: string) => {
    if (confirm('이 작품의 판매 심사를 거절하시겠습니까?')) {
      workStore.rejectSale(workId);
      alert('판매 심사가 거절되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-[32px] font-bold mb-2">관리자 대시보드</h1>
          <p className="text-muted-foreground">판매 심사를 관리합니다</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">심사 대기</span>
              <Eye className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{requestedWorks.length}</div>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">판매 승인</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{works.filter(w => w.saleStatus === 'approved').length}</div>
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">전체 작품</span>
              <XCircle className="h-5 w-5 text-gray-500" />
            </div>
            <div className="text-2xl font-bold">{works.length}</div>
          </div>
        </div>

        {/* 판매 심사 탭 */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">판매 심사 ({requestedWorks.length})</h2>
          
          {requestedWorks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              현재 심사 대기 중인 작품이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {requestedWorks.map(work => {
                const firstImage = Array.isArray(work.image) ? work.image[0] : work.image;
                
                return (
                  <div key={work.id} className="flex gap-4 p-4 border rounded-lg">
                    <img
                      src={firstImage}
                      alt={work.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{work.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        신청일: {work.saleRequestDate ? new Date(work.saleRequestDate).toLocaleDateString('ko-KR') : '-'}
                      </p>
                      {work.saleRequest && (
                        <div className="space-y-2 mb-3">
                          <div className="text-sm">
                            <span className="font-medium">작품 설명:</span> {work.saleRequest.description}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">인터뷰:</span> {work.saleRequest.interview}
                          </div>
                          <div className="text-sm flex gap-4">
                            <span><span className="font-medium">가격:</span> ₩{parseInt(work.saleRequest.price).toLocaleString()}</span>
                            <span><span className="font-medium">에디션:</span> {work.saleRequest.editionSize}개</span>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleApprove(work.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          onClick={() => handleReject(work.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          거절
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
