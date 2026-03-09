import { X } from 'lucide-react';
import { Work, artists, works } from '../data';
import { imageUrls } from '../imageUrls';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getFirstImage } from '../utils/imageHelper';
import { useNavigate } from 'react-router-dom';

interface ArtistWorksModalProps {
  artistId: string;
  onClose: () => void;
}

export function ArtistWorksModal({ artistId, onClose }: ArtistWorksModalProps) {
  const navigate = useNavigate();
  const artist = artists.find(a => a.id === artistId);
  
  // 해당 작가의 작품 필터링
  const artistWorks = works.filter(work => work.artist.id === artistId);
  
  if (!artist) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative bg-[#F8F8F8] w-full max-w-[1200px] max-h-[90vh] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-[24px] font-bold text-gray-900">
              {artist.name}의 다른 작품
            </h2>
            <p className="text-[13px] text-gray-600 mt-1">
              총 {artistWorks.length}개의 판매 중인 작품
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>
        
        {/* 작품 그리드 */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-3 gap-6">
            {artistWorks.map((work, idx) => {
              // 가격 정보 생성
              const basePrice = 10000 + idx * 5000;
              const hasDiscount = idx % 3 === 0;
              const discountPercent = hasDiscount ? 20 : 0;
              const finalPrice = hasDiscount ? Math.floor(basePrice * 0.8) : basePrice;
              
              return (
                <div
                  key={work.id}
                  className="group cursor-pointer bg-white"
                  onClick={() => {
                    onClose();
                    // 작품 상세로 이동할 수 있음
                  }}
                >
                  {/* 작품 이미지 - 정사각, 비율 유지 */}
                  <div className="relative aspect-square bg-[#F5F5F0] flex items-center justify-center p-6 mb-4 overflow-hidden">
                    <div className="absolute inset-0 bg-[#F5F5F0]" />
                    
                    {/* 액자 프레임 - 정사각 */}
                    <div className="relative w-full h-full max-w-[280px] max-h-[280px] bg-white shadow-2xl aspect-square">
                      {/* 외부 프레임 (검은색) */}
                      <div className="absolute inset-0 bg-[#1a1a1a] p-[14px]">
                        {/* 내부 매트 (흰색 여백) */}
                        <div className="w-full h-full bg-white p-[18px] shadow-inner">
                          {/* 작품 이미지 */}
                          <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-white">
                            <ImageWithFallback
                              src={imageUrls[getFirstImage(work.image)] || getFirstImage(work.image)}
                              alt={work.title}
                              className="w-full h-full min-w-0 min-h-0 object-contain object-center group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 호버 시 QUICK VIEW */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black py-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[12px] font-bold tracking-wider">
                        QUICK VIEW
                      </span>
                    </div>
                  </div>
                  
                  {/* 작품 정보 */}
                  <div className="px-3 pb-4">
                    {/* 구분선 */}
                    <div className="w-full h-[1px] bg-gray-200 mb-3" />
                    
                    {/* 제목 */}
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2 leading-tight line-clamp-2">
                      {work.title}
                    </h3>
                    
                    {/* 가격 */}
                    <div className="mb-3">
                      <span className="text-[13px] text-gray-700">
                        Starting at <span className="font-bold text-gray-900">₩{finalPrice.toLocaleString()}</span>
                      </span>
                    </div>
                    
                    {/* 커스터마이징 옵션 */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600">
                      <span className="font-semibold">Customize:</span>
                      <span className="flex items-center gap-1">
                        <span className="text-green-600">✓</span>
                        Frame Selection
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-green-600">✓</span>
                        Frame Color
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-green-600">✓</span>
                        Size
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 작가 프로필 방문 버튼 */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                navigate(`/browse?filter=for-sale&artist=${artistId}`);
                onClose();
              }}
              className="px-10 py-4 bg-black text-white text-[13px] font-bold uppercase tracking-[0.15em] rounded-md hover:bg-gray-800 transition-colors"
            >
              VISIT ARTIST SHOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}