import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Download, Eye, X, Edit2, Plus, ShieldCheck, Clock, Package } from 'lucide-react';
import { artists } from '../data';
import { workStore } from '../store';
import { Work } from '../data';
import { Button } from '../components/ui/button';
import { getFirstImage } from '../utils/imageHelper';
import { imageUrls } from '../imageUrls';

export default function SalesManagement() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const currentUserId = artists[0].id; // 현재 로그인 사용자

  // workStore 구독 — 내 작품만 필터링
  useEffect(() => {
    const update = () => {
      const allWorks = workStore.getWorks();
      setWorks(allWorks.filter(w => w.artistId === currentUserId));
    };
    update();
    return workStore.subscribe(update);
  }, [currentUserId]);

  // 소장하기 설정 모달
  const [collectionModalWorkId, setCollectionModalWorkId] = useState<string | null>(null);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowPrint, setAllowPrint] = useState(true);
  const [price, setPrice] = useState('5000');

  // 모달 열 때 기존 설정 불러오기
  const openCollectionModal = (work: Work) => {
    const opts = work.saleOptions;
    const existingPrice = opts?.download?.price;
    setPrice(existingPrice && existingPrice > 0 ? String(existingPrice) : '5000');
    setAllowDownload(!!opts?.download);
    setAllowPrint(!!opts?.print);
    setCollectionModalWorkId(work.id);
  };

  // 설정 저장 → workStore 반영 (액자 판매이므로 무료 없음, 최소 가격 적용)
  const handleSaveSettings = () => {
    if (!collectionModalWorkId) return;
    const parsedPrice = Math.max(parseInt(price) || 5000, 1000); // 최소 1,000원
    workStore.updateWork(collectionModalWorkId, {
      saleOptions: {
        download: allowDownload ? { price: parsedPrice } : undefined,
        print: allowPrint
          ? { sizes: [{ size: 'A3', price: parsedPrice + 50000 }, { size: 'A2', price: parsedPrice + 100000 }] }
          : undefined,
      },
      isForSale: allowDownload || allowPrint,
    });
    setCollectionModalWorkId(null);
  };

  // 판매 승인된 작품 목록
  const approvedWorks = works.filter(w => w.saleStatus === 'approved');
  // 심사 요청 중인 작품
  const requestedWorks = works.filter(w => w.saleStatus === 'requested');

  // 통계 계산 (실제 데이터 기반)
  const salesStats = {
    totalRevenue: approvedWorks.reduce((sum, w) => {
      const p = w.saleOptions?.download?.price ?? 0;
      return sum + p * Math.floor((w.saves || 0) * 0.3); // saves 기반 추정 수익
    }, 0),
    totalDownloads: approvedWorks.reduce((sum, w) => sum + Math.floor((w.saves || 0) * 0.3), 0),
    totalViews: works.reduce((sum, w) => sum + (w.likes || 0) * 10, 0),
    approvedCount: approvedWorks.length,
    requestedCount: requestedWorks.length,
  };
  const conversionRate = salesStats.totalViews > 0
    ? ((salesStats.totalDownloads / salesStats.totalViews) * 100).toFixed(1)
    : '0.0';



  return (
    <div className="min-h-screen bg-gray-50">
      {/* 소장하기 설정 모달 */}
      {collectionModalWorkId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCollectionModalWorkId(null)}
          />

          <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h2 className="text-[18px] font-semibold text-gray-900">💰 소장하기 설정</h2>
              <button
                onClick={() => setCollectionModalWorkId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[14px] font-medium text-gray-900 mb-1">다운로드 허용</label>
                    <p className="text-[12px] text-gray-500">사용자가 작품을 다운로드할 수 있습니다</p>
                  </div>
                  <button
                    onClick={() => setAllowDownload(!allowDownload)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowDownload ? 'bg-cyan-500' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowDownload ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[14px] font-medium text-gray-900 mb-1">프린트 허용</label>
                    <p className="text-[12px] text-gray-500">사용자가 작품을 인쇄할 수 있습니다</p>
                  </div>
                  <button
                    onClick={() => setAllowPrint(!allowPrint)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowPrint ? 'bg-cyan-500' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowPrint ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>

                <div className="border-t border-gray-200"></div>

                <div>
                  <label className="block text-[14px] font-medium text-gray-900 mb-3">가격 설정</label>
                  <p className="text-[12px] text-gray-500 mb-2">액자/프린트 판매이므로 최소 1,000원 이상 설정됩니다.</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-500">₩</span>
                    <input
                      type="number"
                      min={1000}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="5000"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>
                </div>

              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setCollectionModalWorkId(null)}
                className="px-5 py-2.5 text-[14px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-cyan-500 text-white text-[14px] font-medium rounded-lg hover:bg-cyan-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1440px] px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] font-semibold text-gray-900">판매 관리</h1>
              <p className="text-[14px] text-gray-500 mt-1">작품 판매 현황 및 가격 설정을 관리하세요</p>
            </div>
            <Button
              onClick={() => navigate('/upload')}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 작품 업로드
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-500 font-medium">추정 수익</span>
              <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-[26px] font-semibold text-gray-900">₩{salesStats.totalRevenue.toLocaleString()}</div>
            <div className="text-[12px] text-gray-500 mt-2">saves 기반 추정</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-500 font-medium">판매 승인</span>
              <div className="h-10 w-10 bg-cyan-50 rounded-full flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
            <div className="text-[26px] font-semibold text-gray-900">{salesStats.approvedCount}</div>
            <div className="text-[12px] text-gray-500 mt-2">승인된 작품</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-500 font-medium">심사 대기</span>
              <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="text-[26px] font-semibold text-gray-900">{salesStats.requestedCount}</div>
            <div className="text-[12px] text-gray-500 mt-2">승인 대기 중</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-gray-500 font-medium">전환율</span>
              <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-[26px] font-semibold text-gray-900">{conversionRate}%</div>
            <div className="text-[12px] text-gray-500 mt-2">likes → saves</div>
          </div>
        </div>

        {/* 판매 승인된 작품 목록 */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-gray-900">
              판매 승인 작품
              <span className="ml-2 text-[14px] font-normal text-gray-500">({approvedWorks.length})</span>
            </h2>
            {requestedWorks.length > 0 && (
              <span className="flex items-center gap-1.5 text-[13px] text-orange-600 font-medium">
                <Clock className="h-4 w-4" />
                심사 대기 {requestedWorks.length}건
              </span>
            )}
          </div>

          {approvedWorks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-[14px]">판매 승인된 작품이 없습니다.</p>
              <p className="text-[12px] mt-1">관리자 승인 후 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-600 uppercase tracking-wider">작품</th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-600 uppercase tracking-wider">가격</th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-gray-600 uppercase tracking-wider">좋아요 / 저장</th>
                    <th className="px-6 py-3 text-right text-[12px] font-semibold text-gray-600 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {approvedWorks.map((work) => {
                    const imgKey = getFirstImage(work.image);
                    const imgSrc = imageUrls[imgKey] || imgKey;
                    const dlPrice = work.saleOptions?.download?.price;
                    return (
                      <tr key={work.id} className="hover:bg-gray-50 transition-colors">
                        {/* 작품 썸네일 + 제목 */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                              <img
                                src={imgSrc}
                                alt={work.title}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48'; }}
                              />
                            </div>
                            <div>
                              <div className="text-[14px] font-medium text-gray-900">{work.title}</div>
                              <div className="text-[12px] text-gray-500">{work.artist?.name}</div>
                            </div>
                          </div>
                        </td>
                        {/* 가격 */}
                        <td className="px-6 py-4">
                          {dlPrice && dlPrice > 0 ? (
                            <span className="text-[14px] font-medium text-gray-900">₩{dlPrice.toLocaleString()}</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[12px] font-medium">
                              가격 설정 필요
                            </span>
                          )}
                        </td>
                        {/* 통계 */}
                        <td className="px-6 py-4">
                          <span className="text-[13px] text-gray-600">
                            ❤️ {work.likes} &nbsp; 🔖 {work.saves}
                          </span>
                        </td>
                        {/* 버튼 */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/work/${work.id}`)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="보기"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => openCollectionModal(work)}
                              className="p-2 hover:bg-cyan-50 rounded-lg transition-colors"
                              title="가격 수정"
                            >
                              <Edit2 className="h-4 w-4 text-cyan-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}