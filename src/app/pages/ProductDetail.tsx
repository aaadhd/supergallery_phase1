import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Star, Package, RefreshCw, Minus, Plus } from 'lucide-react';
import { works } from '../data';
import { imageUrls } from '../imageUrls';
import { getAllImages, getFirstImage } from '../utils/imageHelper';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const work = works.find(w => w.id === id);
  
  const [selectedFrame, setSelectedFrame] = useState('black');
  const [selectedSize, setSelectedSize] = useState('small');
  const [quantity, setQuantity] = useState(1);
  const [selectedThumbnail, setSelectedThumbnail] = useState(0);
  const [imageRatio, setImageRatio] = useState(1); // 이미지 비율 저장
  
  // 상품을 찾지 못한 경우
  if (!work) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">상품을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate('/browse?filter=for-sale')}>
            마켓플레이스로 돌아가기
          </Button>
        </div>
      </div>
    );
  }
  
  const frames = [
    { id: 'black', label: 'Black Frame', price: 0 },
    { id: 'white', label: 'White Frame', price: 0 },
    { id: 'wood', label: 'Wood Frame', price: 0 },
    { id: 'none', label: 'No Frame', price: -20 },
  ];
  
  const sizes = [
    { id: 'small', label: '13" × 19"', price: 65 },
    { id: 'medium', label: '18" × 24"', price: 95 },
    { id: 'large', label: '24" × 36"', price: 135 },
  ];
  
  const currentPrice = sizes.find(s => s.id === selectedSize)?.price || 65;
  
  // 작품의 모든 이미지를 가져오기
  const allImages = getAllImages(work.image);
  const thumbnails = allImages.map(img => imageUrls[img] || img);
  
  const handleAddToCart = () => {
    // TODO: 장바구니 로직 구현
    alert('장바구니에 추가되었습니다!');
  };
  
  // 선택한 프레임에 따른 스타일
  const getFrameStyle = () => {
    switch (selectedFrame) {
      case 'black':
        return 'bg-[#1a1a1a]';
      case 'white':
        return 'bg-white border-2 border-gray-200';
      case 'wood':
        return 'bg-gradient-to-br from-[#8B4513] to-[#654321]';
      case 'none':
        return 'bg-transparent';
      default:
        return 'bg-[#1a1a1a]';
    }
  };
  
  // 이미지 비율에 따른 액자 크기 계산 (Browse와 동일한 로직)
  const getFrameSizeStyle = () => {
    const maxWidth = 95;
    const maxHeight = 95;
    
    if (imageRatio > 1.2) {
      // 가로가 긴 경우
      return {
        width: `${maxWidth}%`,
        height: `${maxWidth / imageRatio}%`
      };
    } else if (imageRatio < 0.8) {
      // 세로가 긴 경우
      return {
        width: `${maxHeight * imageRatio}%`,
        height: `${maxHeight}%`
      };
    } else {
      // 거의 정사각형인 경우
      return {
        width: '90%',
        height: '90%'
      };
    }
  };
  
  const frameSizeStyle = getFrameSizeStyle();
  
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="grid grid-cols-12 gap-12">
          {/* 왼쪽: 썸네일 + 메인 이미지 (7컬럼) */}
          <div className="col-span-7">
            <div className="flex gap-6">
              {/* 썸네일 세로 배치 */}
              <div className="flex flex-col gap-4">
                {thumbnails.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedThumbnail(idx)}
                    className={`w-20 h-20 border-2 rounded overflow-hidden transition-all ${
                      selectedThumbnail === idx
                        ? 'border-gray-900'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {idx === 0 ? (
                      // 첫 번째 썸네일: 액자 디테일 미리보기
                      <div className="relative w-full h-full bg-[#F5F5F0] p-2 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          <div className={`absolute inset-0 ${getFrameStyle()} p-[2px]`}>
                            <div className="w-full h-full bg-white p-[3px]">
                              <ImageWithFallback
                                src={thumb}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 두 번째 썸네일: 공간에 걸린 모습 미리보기
                      <div className="relative w-full h-full overflow-hidden">
                        {/* 배경 (거실) */}
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1764010533326-c6916f3d6252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwd2hpdGUlMjB3YWxsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyODg5MjIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                          alt="Room"
                          className="w-full h-full object-cover"
                        />
                        {/* 작은 액자 */}
                        <div 
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{
                            width: imageRatio > 1 ? '40%' : `${40 * imageRatio}%`,
                            height: imageRatio < 1 ? '50%' : `${50 / imageRatio}%`,
                          }}
                        >
                          <div className={`w-full h-full ${getFrameStyle()} p-[1px]`}>
                            <div className="w-full h-full bg-white p-[2px]">
                              <ImageWithFallback
                                src={thumb}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* 메인 이미지 */}
              <div className="flex-1 aspect-square bg-[#F5F5F0] flex items-center justify-center p-8">
                {/* 이미지 비율 계산용 숨김 이미지 */}
                <img
                  src={thumbnails[selectedThumbnail]}
                  alt=""
                  className="hidden"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    const ratio = img.naturalWidth / img.naturalHeight;
                    setImageRatio(ratio);
                  }}
                />
                
                {selectedThumbnail === 0 ? (
                  // 첫 번째: 단독 액자 뷰
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* 액자 - 선택에 따라 변경, 이미지 비율에 맞게 크기 조정 */}
                    {selectedFrame !== 'none' ? (
                      <div 
                        className={`relative ${getFrameStyle()} shadow-2xl transition-all duration-300`}
                        style={frameSizeStyle}
                      >
                        {/* 외부 프레임 */}
                        <div className="absolute inset-0 p-[16px]">
                          {/* 흰색 매트 */}
                          <div className="w-full h-full bg-white p-[28px] shadow-inner">
                            {/* 작품 이미지 */}
                            <div className="relative w-full h-full overflow-hidden">
                              <ImageWithFallback
                                src={thumbnails[selectedThumbnail]}
                                alt={work.title}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // No Frame - 매트만
                      <div 
                        className="relative shadow-xl transition-all duration-300"
                        style={frameSizeStyle}
                      >
                        <div className="w-full h-full bg-white p-[28px]">
                          <div className="relative w-full h-full overflow-hidden">
                            <ImageWithFallback
                              src={thumbnails[selectedThumbnail]}
                              alt={work.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 두 번째: 실제 공간에 걸린 모습
                  <div className="relative w-full h-full overflow-hidden rounded-sm">
                    {/* 배경 이미지 (거실) */}
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1764010533326-c6916f3d6252?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBsaXZpbmclMjByb29tJTIwd2hpdGUlMjB3YWxsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyODg5MjIzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                      alt="Room interior"
                      className="w-full h-full object-cover"
                    />
                    {/* 벽에 걸린 액자 - 이미지 비율에 맞게 조정 */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl"
                      style={{
                        width: imageRatio > 1 ? '40%' : `${40 * imageRatio}%`,
                        height: imageRatio < 1 ? '50%' : `${50 / imageRatio}%`,
                      }}
                    >
                      {selectedFrame !== 'none' ? (
                        <div className={`w-full h-full ${getFrameStyle()} p-[10px] transition-colors duration-300`}>
                          <div className="w-full h-full bg-white p-[16px]">
                            <ImageWithFallback
                              src={thumbnails[selectedThumbnail]}
                              alt={work.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full p-[10px]">
                          <div className="w-full h-full bg-white p-[16px] shadow-xl">
                            <ImageWithFallback
                              src={thumbnails[selectedThumbnail]}
                              alt={work.title}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 오른쪽: 상품 정보 (5컬럼) */}
          <div className="col-span-5">
            {/* 제목 */}
            <h1 className="text-[28px] font-normal text-gray-900 mb-2 leading-tight">
              {work.title}
            </h1>
            
            {/* 작가명 */}
            <div className="mb-6">
              <span className="text-[12px] text-gray-600 uppercase tracking-wide">
                BY: <span className="font-semibold text-gray-900">{work.artist.name.toUpperCase()}</span>
              </span>
            </div>
            
            {/* 가격 + 리뷰 */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
              <div className="text-[32px] font-bold text-gray-900">
                ${currentPrice}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-gray-300"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="text-[13px] text-gray-600">0 Reviews</span>
              </div>
            </div>
            
            {/* Frame Selection */}
            <div className="mb-8">
              <div className="mb-3">
                <span className="text-[13px] font-semibold text-gray-900">Frame Selection: </span>
                <span className="text-[13px] text-gray-600 capitalize">{selectedFrame.replace('-', ' ')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {frames.map(frame => (
                  <button
                    key={frame.id}
                    onClick={() => setSelectedFrame(frame.id)}
                    className={`px-4 py-2.5 text-[11px] font-bold tracking-wider border transition-all ${
                      selectedFrame === frame.id
                        ? 'border-gray-900 bg-white text-gray-900'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {frame.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Size */}
            <div className="mb-8">
              <div className="mb-3">
                <span className="text-[13px] font-semibold text-gray-900">Size: </span>
                <span className="text-[13px] text-gray-600">
                  {sizes.find(s => s.id === selectedSize)?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`px-4 py-2.5 text-[11px] font-bold tracking-wider border transition-all ${
                      selectedSize === size.id
                        ? 'border-gray-900 bg-white text-gray-900'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quantity */}
            <div className="mb-8">
              <div className="mb-3">
                <span className="text-[13px] font-semibold text-gray-900">Quantity</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, val));
                  }}
                  className="w-16 h-10 text-center border border-gray-300 text-[14px] font-medium"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* ADD TO CART */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-black text-white text-[13px] font-bold tracking-wider py-4 mb-8 hover:bg-gray-800 transition-colors"
            >
              ADD TO CART
            </button>
            
            {/* 안내 메시지 */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  Items are made to order and typically ship within 3-4 business days.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  Easy 30-Day Returns—no stress, no hassle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}