import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Type, Video, Grid, Folder, Plus, ArrowDownUp, User, Upload as UploadIcon, X, Info, Monitor, Search, UserPlus, Palette, Download } from 'lucide-react';
import { artists } from '../data';
import { workStore, draftStore } from '../store';
import type { Work } from '../data';

// 작품 업로드 페이지 - 1~10장의 이미지 업로드 지원
export default function Upload() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<string | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [contents, setContents] = useState<Array<{ id: string; type: 'image' | 'text'; url?: string; text?: string; title?: string; artist?: { id: string; name: string; avatar: string } }>>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [contentSpacing, setContentSpacing] = useState(16);
  const [isPrivate, setIsPrivate] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isOriginalWork, setIsOriginalWork] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDrawingImportModal, setShowDrawingImportModal] = useState(false);
  const [title, setTitle] = useState(''); // 작품명 (필수)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [detailTags, setDetailTags] = useState<string[]>([]);
  const [detailTagInput, setDetailTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coOwnerSearch, setCoOwnerSearch] = useState('');
  const [selectedCoOwners, setSelectedCoOwners] = useState<Array<{ id: string; name: string; avatar: string }>>([]);
  const [groupName, setGroupName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [artistSearch, setArtistSearch] = useState(''); // 작업자 검색

  // 작품 커스터마이징 상태
  const [customizeTab, setCustomizeTab] = useState<'frame' | 'effect' | 'lighting'>('effect');

  // 개별 이미지별 커스터마이징 설정
  const [imageCustomizations, setImageCustomizations] = useState<Record<string, {
    frame: string;
    effect: string | null;
    intensity: number;
    speed: number;
    lightingAngle: number;
    lightingIntensity: number;
  }>>({});

  // 드로잉 툴에서 완성한 작품 목록
  const [savedDrawings, setSavedDrawings] = useState<Array<{ id: string; url: string; title: string; timestamp: number }>>([]);

  // 컴포넌트 마운트 시 localStorage에서 드로잉 작품 불러오기
  useEffect(() => {
    const loadSavedDrawings = () => {
      try {
        const drawings = localStorage.getItem('artier_drawings');
        if (drawings) {
          setSavedDrawings(JSON.parse(drawings));
        }
      } catch (error) {
        console.error('드로잉 작품 불러오기 실패:', error);
      }
    };

    loadSavedDrawings();

    // postMessage를 통한 드로잉 툴과의 통신 리스너
    const handleMessage = (event: MessageEvent) => {
      // 보안을 위해 origin 체크 (실제 환경에서는 드로잉 툴의 origin으로 변경)
      // if (event.origin !== 'https://your-drawing-tool.com') return;

      if (event.data.type === 'DRAWING_SAVED') {
        const newDrawing = {
          id: `drawing-${Date.now()}`,
          url: event.data.imageUrl,
          title: event.data.title || '제목 없음',
          timestamp: Date.now(),
        };

        // localStorage에 저장
        const currentDrawings = JSON.parse(localStorage.getItem('artier_drawings') || '[]');
        const updatedDrawings = [newDrawing, ...currentDrawings];
        localStorage.setItem('artier_drawings', JSON.stringify(updatedDrawings));
        setSavedDrawings(updatedDrawings);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const imageTypes = [
    { id: 'image', icon: ImageIcon, label: '작품 추가' },
    { id: 'drawing', icon: Palette, label: '드로잉 툴에서 가져오기' },
  ];

  const projectTypes = [
    { id: 'project', icon: Folder, label: '프로젝트 게재용' },
    { id: 'new', icon: Plus, label: '새로 만들기 설정' },
    { id: 'sort', icon: ArrowDownUp, label: '정렬' },
    { id: 'user', icon: User, label: '사용자 설정' },
  ];

  const templates = [
    {
      id: 'aether',
      name: '에테르',
      description: '우주의 빛과 유체가 작품을 감싸요',
      svgFilter: 'aether',
    },
    {
      id: 'liquid',
      name: '리퀴드 팔레트',
      description: '작품의 색상들이 녹아내려 환상적인 물결을 만듭니다',
      svgFilter: 'liquid',
    },
    {
      id: 'cyber',
      name: '사이버 인셉션',
      description: '공간이 뒤틀리며 흐릿한 픽셀 속으로 잠겨듭니다',
      svgFilter: 'cyber',
    },
    {
      id: 'digital',
      name: '디지털 피버',
      description: '작품이 디지털 신호로 깨어나요',
      svgFilter: 'digital',
    },
    {
      id: 'neon',
      name: '네온 드림',
      description: '네온 불빛이 작품 주변을 감싸며 빛납니다',
      svgFilter: 'neon',
    },
    {
      id: 'vintage',
      name: '빈티지 필름',
      description: '오래된 필름 카메라로 촬영한 듯한 따뜻한 감성',
      svgFilter: 'vintage',
    },
    {
      id: 'frost',
      name: '프로스트 글래스',
      description: '서리가 낀 유리창 너머로 보는 듯한 몽환적 느낌',
      svgFilter: 'frost',
    },
    {
      id: 'hologram',
      name: '홀로그램',
      description: '미래적 홀로그램 투영 효과',
      svgFilter: 'hologram',
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: Array<{ id: string; url: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({ id: `${file.name}-${Date.now()}-${i}`, url: e.target?.result as string });
          if (newImages.length === files.length) {
            setContents([...contents, ...newImages.map(img => ({ ...img, type: 'image' as const }))]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      const newImages: Array<{ id: string; url: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({ id: `${file.name}-${Date.now()}-${i}`, url: e.target?.result as string });
          if (newImages.length === files.length) {
            setContents([...contents, ...newImages.map(img => ({ ...img, type: 'image' as const }))]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleAddDetailTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && detailTagInput.trim()) {
      e.preventDefault();
      if (!detailTags.includes(detailTagInput.trim())) {
        setDetailTags([...detailTags, detailTagInput.trim()]);
      }
      setDetailTagInput('');
    }
  };

  return (
    <div className="h-screen bg-[#FAFAFA] flex overflow-hidden">
      {/* SVG 필터 정의 */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* 에테르: 발광 효과 + 색상 시프트 */}
          <filter id="aether">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1.2 0 0 0 0.05
                      0 1.1 0.2 0 0.1
                      0 0.1 1.3 0 0.15
                      0 0 0 1 0"
              result="colorShift"
            />
            <feGaussianBlur in="colorShift" stdDeviation="8" result="glow" />
            <feBlend in="colorShift" in2="glow" mode="screen" result="final" />
            <feComponentTransfer in="final">
              <feFuncR type="linear" slope="1.15" />
              <feFuncG type="linear" slope="1.1" />
              <feFuncB type="linear" slope="1.25" />
            </feComponentTransfer>
          </filter>

          {/* 리퀴드 팔레트: 왜곡 + 유동적 노이즈 */}
          <filter id="liquid">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" result="displace" />
            <feColorMatrix
              in="displace"
              type="saturate"
              values="1.6"
              result="saturated"
            />
            <feGaussianBlur in="saturated" stdDeviation="0.8" result="blur" />
            <feBlend in="blur" in2="SourceGraphic" mode="overlay" />
          </filter>

          {/* 사이버 인셉션: RGB 분리 + 글리치 */}
          <filter id="cyber">
            <feOffset in="SourceGraphic" dx="3" dy="0" result="offsetR" />
            <feOffset in="SourceGraphic" dx="-3" dy="0" result="offsetB" />
            <feColorMatrix
              in="offsetR"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.7 0"
              result="redChannel"
            />
            <feColorMatrix
              in="offsetB"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 0.7 0"
              result="blueChannel"
            />
            <feBlend in="redChannel" in2="SourceGraphic" mode="screen" result="blend1" />
            <feBlend in="blueChannel" in2="blend1" mode="screen" result="blend2" />
            <feComponentTransfer in="blend2">
              <feFuncR type="linear" slope="1.3" />
              <feFuncG type="linear" slope="1.2" />
              <feFuncB type="linear" slope="1.4" />
            </feComponentTransfer>
          </filter>

          {/* 디지털 피버: 스캔라인 + 픽셀 효과 */}
          <filter id="digital">
            <feTurbulence type="fractalNoise" baseFrequency="0.8 0.01" numOctaves="1" result="scanlines" />
            <feColorMatrix
              in="scanlines"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0.2
                      0 0 0 0 0.2
                      0 0 0 0.15 0"
              result="scanColor"
            />
            <feBlend in="SourceGraphic" in2="scanColor" mode="hard-light" result="scanBlend" />
            <feComponentTransfer in="scanBlend">
              <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1" />
              <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1" />
              <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1" />
            </feComponentTransfer>
          </filter>

          {/* 네온 드림: 강한 발광 + 색상 번짐 */}
          <filter id="neon">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0" result="sharp" />
            <feColorMatrix
              in="sharp"
              type="matrix"
              values="1.5 0 0 0 0
                      0 1.3 0.3 0 0
                      0.3 0 1.6 0 0
                      0 0 0 1 0"
              result="colorBoost"
            />
            <feGaussianBlur in="colorBoost" stdDeviation="12" result="glow1" />
            <feGaussianBlur in="colorBoost" stdDeviation="6" result="glow2" />
            <feBlend in="colorBoost" in2="glow1" mode="screen" result="blend1" />
            <feBlend in="blend1" in2="glow2" mode="color-dodge" result="final" />
            <feComponentTransfer in="final">
              <feFuncR type="gamma" amplitude="1.2" exponent="0.9" />
              <feFuncG type="gamma" amplitude="1.15" exponent="0.95" />
              <feFuncB type="gamma" amplitude="1.3" exponent="0.85" />
            </feComponentTransfer>
          </filter>

          {/* 빈티지 필름: 그레인 노이즈 + 비네팅 */}
          <filter id="vintage">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="grain" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.08 0"
              result="grainAlpha"
            />
            <feBlend in="SourceGraphic" in2="grainAlpha" mode="multiply" result="grainBlend" />
            <feColorMatrix
              in="grainBlend"
              type="matrix"
              values="1.1 0.15 0.05 0 0
                      0.1 1 0.1 0 0
                      0.05 0.1 0.8 0 0
                      0 0 0 1 0"
              result="sepia"
            />
            <feGaussianBlur in="sepia" stdDeviation="0.5" />
          </filter>

          {/* 프로스트 글래스: 프랙탈 블러 */}
          <filter id="frost">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="5" result="frost" />
            <feDisplacementMap in="SourceGraphic" in2="frost" scale="8" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1.15 0 0 0 0.05
                      0 1.1 0.05 0 0.08
                      0.05 0.05 1.15 0 0.1
                      0 0 0 0.95 0"
              result="tint"
            />
            <feBlend in="tint" in2="SourceGraphic" mode="overlay" />
          </filter>

          {/* 홀로그램: 프리즘 효과 + 무지개 색상 */}
          <filter id="hologram">
            <feOffset in="SourceGraphic" dx="2" dy="0" result="offsetR" />
            <feOffset in="SourceGraphic" dx="0" dy="0" result="offsetG" />
            <feOffset in="SourceGraphic" dx="-2" dy="0" result="offsetB" />
            <feColorMatrix
              in="offsetR"
              type="matrix"
              values="0.8 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.6 0"
              result="redCh"
            />
            <feColorMatrix
              in="offsetG"
              type="matrix"
              values="0 0 0 0 0
                      0 0.8 0 0 0
                      0 0 0 0 0
                      0 0 0 0.6 0"
              result="greenCh"
            />
            <feColorMatrix
              in="offsetB"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0.8 0 0
                      0 0 0 0.6 0"
              result="blueCh"
            />
            <feBlend in="redCh" in2="greenCh" mode="screen" result="blend1" />
            <feBlend in="blend1" in2="blueCh" mode="screen" result="blend2" />
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="rainbow" />
            <feDisplacementMap in="blend2" in2="rainbow" scale="3" result="final" />
            <feComponentTransfer in="final">
              <feFuncR type="linear" slope="1.35" />
              <feFuncG type="linear" slope="1.25" />
              <feFuncB type="linear" slope="1.4" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />

      {/* 세부 정보 설정 모달 */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 딥 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDetailsModal(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
              <h2 className="text-[20px] font-semibold text-gray-900">세부 정보 설정</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* 왼쪽: 커버 이미지 */}
                <div>
                  <h3 className="text-[15px] font-medium text-gray-900 mb-2">
                    커버 이미지 <span className="text-cyan-500">(필수)</span>
                  </h3>
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4"></div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                      콘텐츠에서 선택
                    </button>
                    <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-[14px] text-gray-700 hover:bg-gray-50 transition-colors">
                      직접 업로드
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-500 mt-3">
                    권장 이미지 크기 사이즈는 780x780이며, 5MB 이상 허용되지 않습니다. GIF 파일은 업로드할 수 있습니다.
                  </p>
                </div>

                {/* 오른쪽: 제목, 카테고리, 태그 */}
                <div>
                  {/* 제목 */}
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">
                      제목 <span className="text-cyan-500">(필수)</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="제목을 입력하세요."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                  </div>

                  {/* 카테고리 */}
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">
                      카테고리 <span className="text-cyan-500">(필수)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        '미술',
                        '패션',
                        '공예',
                        '제품 디자인',
                      ].map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            if (selectedCategories.includes(category)) {
                              setSelectedCategories(selectedCategories.filter(c => c !== category));
                            } else {
                              setSelectedCategories([...selectedCategories, category]);
                            }
                          }}
                          className={`px-3 py-2 text-[13px] rounded-lg border transition-colors ${selectedCategories.includes(category)
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 태그 */}
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">태그</label>
                    <input
                      type="text"
                      value={detailTagInput}
                      onChange={(e) => setDetailTagInput(e.target.value)}
                      onKeyDown={handleAddDetailTag}
                      placeholder="Tab, Enter로 구분하여 입력해주세요."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    />
                    {detailTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {detailTags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-[12px] rounded-full flex items-center gap-2"
                          >
                            {tag}
                            <button
                              onClick={() => setDetailTags(detailTags.filter((_, i) => i !== index))}
                              className="hover:text-gray-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 그룹 소유자 및 크레딧 */}
                  <div className="mb-6">
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">
                      <UserPlus className="h-4 w-4 inline-block mr-1" />
                      그룹 소유자 및 크레딧
                    </label>
                    <p className="text-[12px] text-gray-500 mb-3">
                      프로젝트에 참여한 다른 작가들을 추가하세요. 작품 페이지에 함께 표시됩니다.
                    </p>

                    {/* 검색 입력 */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={coOwnerSearch}
                        onChange={(e) => setCoOwnerSearch(e.target.value)}
                        placeholder="작가 이름으로 검색"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>

                    {/* 검색 결과 */}
                    {coOwnerSearch && (
                      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mb-3">
                        {artists
                          .filter(artist =>
                            artist.name.toLowerCase().includes(coOwnerSearch.toLowerCase()) &&
                            !selectedCoOwners.some(co => co.id === artist.id)
                          )
                          .slice(0, 5)
                          .map(artist => (
                            <button
                              key={artist.id}
                              onClick={() => {
                                setSelectedCoOwners([...selectedCoOwners, {
                                  id: artist.id,
                                  name: artist.name,
                                  avatar: artist.avatar
                                }]);
                                setCoOwnerSearch('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                              <img src={artist.avatar} alt={artist.name} className="h-8 w-8 rounded-full object-cover" />
                              <div>
                                <div className="text-[13px] font-medium text-gray-900">{artist.name}</div>
                                <div className="text-[11px] text-gray-500">{artist.bio}</div>
                              </div>
                            </button>
                          ))
                        }
                        {artists.filter(artist =>
                          artist.name.toLowerCase().includes(coOwnerSearch.toLowerCase()) &&
                          !selectedCoOwners.some(co => co.id === artist.id)
                        ).length === 0 && (
                            <div className="px-4 py-3 text-[13px] text-gray-500 text-center">
                              검색 결과가 없습니다
                            </div>
                          )}
                      </div>
                    )}

                    {/* 선택된 그룹 소유자 목록 */}
                    {selectedCoOwners.length > 0 && (
                      <>
                        <div className="space-y-2 mb-3">
                          {selectedCoOwners.map(coOwner => (
                            <div
                              key={coOwner.id}
                              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <img src={coOwner.avatar} alt={coOwner.name} className="h-7 w-7 rounded-full object-cover" />
                                <span className="text-[13px] font-medium text-gray-900">{coOwner.name}</span>
                              </div>
                              <button
                                onClick={() => setSelectedCoOwners(selectedCoOwners.filter(co => co.id !== coOwner.id))}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* 그룹명 입력 */}
                        <div className="border-t border-gray-200 pt-3">
                          <label className="block text-[13px] font-medium text-gray-900 mb-2">
                            그룹명 <span className="text-gray-500">(선택사항)</span>
                          </label>
                          <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="예: 한국전통화컬렉티브, 컬러스케치팀"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                          />
                          <p className="text-[11px] text-gray-500 mt-2">
                            그룹명을 입력하면 작품 페이지에서 개인 이름 대신 그룹명으로 표시됩니다.
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 저작권 (CCL) */}
                  <div>
                    <label className="block text-[15px] font-medium text-gray-900 mb-2">저작권 (CCL)</label>
                    <p className="text-[13px] text-gray-600">
                      저작권표시-비영리-변경금지 <a href="#" className="text-cyan-500 hover:underline ml-1">저작권 수정 &gt;</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-8 py-5">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2.5 text-[14px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  // 유효성 검사
                  if (!title.trim()) {
                    alert('제목을 입력해주세요.');
                    return;
                  }
                  const imageContents = contents.filter(c => c.type === 'image' && c.url);
                  if (imageContents.length === 0) {
                    alert('이미지를 최소 1장 추가해주세요.');
                    return;
                  }

                  // workStore에 작품 추가
                  const currentUser = artists[0];
                  const imageUrls = imageContents.map(c => c.url!);
                  const newWork: Work = {
                    id: `user-${Date.now()}`,
                    title: title.trim(),
                    image: imageUrls.length === 1 ? imageUrls[0] : imageUrls,
                    artistId: currentUser.id,
                    artist: currentUser,
                    likes: 0,
                    saves: 0,
                    comments: 0,
                    isForSale: false,
                    description: '',
                    tags: [...tags, ...detailTags],
                    category: selectedCategories[0] === '미술' ? 'art'
                      : selectedCategories[0] === '패션' ? 'fashion'
                        : selectedCategories[0] === '공예' ? 'craft'
                          : selectedCategories[0] === '제품 디자인' ? 'product'
                            : 'art',
                    coOwners: selectedCoOwners.length > 0 ? selectedCoOwners.map(co => ({
                      id: co.id,
                      name: co.name,
                      avatar: co.avatar,
                    })) : undefined,
                    groupName: groupName.trim() || undefined,
                    saleStatus: 'none',
                  };

                  workStore.addWork(newWork);
                  setShowDetailsModal(false);
                  alert('작품이 성공적으로 등록되었습니다!');
                  navigate('/profile');
                }}
                className="px-8 py-2.5 bg-cyan-500 text-white text-[14px] font-medium rounded-lg hover:bg-cyan-600 transition-colors"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 드로잉 툴에서 작품 가져오기 모달 */}
      {showDrawingImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 딥 배경 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDrawingImportModal(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl mx-4">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-8 py-6">
              <h2 className="text-[20px] font-semibold text-gray-900">드로잉 툴에서 작품 가져오기</h2>
              <button
                onClick={() => setShowDrawingImportModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 컨텐츠 */}
            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {savedDrawings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                    <Palette className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-[16px] font-medium text-gray-900 mb-2">저장된 드로잉 작품이 없습니다</h3>
                  <p className="text-[14px] text-gray-500 mb-6">
                    드로잉 툴에서 작품을 완성하고 저장하면 여기에 표시됩니다.
                  </p>
                  <button
                    onClick={() => {
                      const drawingToolUrl = 'https://sgf.iproud.app/studio'; // 실제 드로잉 툴 URL로 변경
                      const urlWithParams = `${drawingToolUrl}?source=artier&returnUrl=${encodeURIComponent(window.location.origin + '/upload')}`;
                      window.open(urlWithParams, '_blank');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white text-[14px] font-medium rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    <Palette className="h-4 w-4" />
                    드로잉 툴 열기
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-8 mb-8">
                  {/* 왼쪽: 드로잉 작품 목록 */}
                  <div>
                    <h3 className="text-[15px] font-medium text-gray-900 mb-4">
                      저장된 작품 ({savedDrawings.length}개)
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {savedDrawings.map(drawing => (
                        <div key={drawing.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <img src={drawing.url} alt={drawing.title} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium text-gray-900 truncate">{drawing.title}</div>
                            <div className="text-[11px] text-gray-500">
                              {new Date(drawing.timestamp).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setContents([...contents, { id: drawing.id, type: 'image', url: drawing.url }]);
                              setShowDrawingImportModal(false);
                            }}
                            className="px-4 py-2 bg-cyan-500 text-white text-[13px] font-medium rounded-lg hover:bg-cyan-600 transition-colors flex-shrink-0"
                          >
                            추가
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 오른쪽: 드로잉 툴 열기 */}
                  <div>
                    <h3 className="text-[15px] font-medium text-gray-900 mb-4">
                      새로운 작품 만들기
                    </h3>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Palette className="h-8 w-8 text-cyan-500" />
                      </div>
                      <p className="text-[13px] text-gray-600 mb-4">
                        드로잉 툴을 열어 새로운 작품을 만드세요.<br />
                        완성된 작품은 자동으로 목록에 추가됩니다.
                      </p>
                      <button
                        onClick={() => {
                          const drawingToolUrl = '/drawing-tool'; // 실제 드로잉 툴 URL로 변경
                          const urlWithParams = `${drawingToolUrl}?source=artier&returnUrl=${encodeURIComponent(window.location.origin + '/upload')}`;
                          window.open(urlWithParams, '_blank');
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-white text-[14px] font-medium rounded-lg hover:bg-cyan-600 transition-colors"
                      >
                        <Palette className="h-4 w-4" />
                        드로잉 툴 열기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-8 py-5">
              <button
                onClick={() => setShowDrawingImportModal(false)}
                className="px-6 py-2.5 text-[14px] text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 좌측: 업로드 & 프리뷰 영역 */}
      <div
        className={`relative flex-1 flex flex-col overflow-y-auto p-12 ${!contents.length ? 'items-center justify-center' : 'items-center justify-start pt-12'}`}
        style={contents.length > 0 ? { backgroundColor } : undefined}
      >
        {/* 작품 테마 배경 레이어 - 전체 영역 */}
        {selectedTemplate && contents.length > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              filter: `url(#${templates.find(t => t.id === selectedTemplate)?.svgFilter})`,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
              opacity: 0.3,
            }}
          />
        )}
        {!contents.length ? (
          <>
            <h2 className="text-[20px] text-gray-600 mb-12">
              콘텐츠를 선택하여 업로드를 시작하세요.
            </h2>

            {/* 파일 업로드 드롭존 */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center transition-all hover:border-cyan-400 hover:bg-cyan-50/30"
            >
              <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-cyan-100 flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-cyan-500" />
              </div>
              <p className="mb-2 text-[16px] font-medium text-gray-700">이미지(최대 10장)를 드래그 또는 업로드해주세요.</p>
              <p className="text-[14px] text-gray-500">최대 10MB의 JPG, JPEG, PNG, WEBP 이미지 파일</p>
            </div>
          </>
        ) : (
          <div className="relative w-full pb-20 z-10">
            {/* 콘텐츠 목록 */}
            <div
              className="relative z-10"
              style={{ display: 'flex', flexDirection: 'column', gap: `${contentSpacing}px` }}
            >
              {contents.map((content, index) => {
                // 개별 이미지 커스터마이징 설정 가져오기
                const customization = imageCustomizations[content.id] || {
                  frame: 'none',
                  effect: null,
                  intensity: 50,
                  speed: 30,
                  lightingAngle: 45,
                  lightingIntensity: 70,
                };

                // 액자 스타일
                const getFrameStyle = (frame: string) => {
                  switch (frame) {
                    case 'none':
                      return { borderWidth: '0px' };
                    case 'modern':
                      return { borderColor: '#1a1a1a', borderWidth: '12px' };
                    case 'wood':
                      return { borderColor: '#8B6F47', borderWidth: '16px', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.3)' };
                    case 'gold':
                      return { borderColor: '#D4AF37', borderWidth: '14px', boxShadow: 'inset 0 0 12px rgba(255,215,0,0.4)' };
                    case 'white':
                      return { borderColor: '#FFFFFF', borderWidth: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };
                    default:
                      return { borderWidth: '0px' };
                  }
                };

                return (
                  <div key={content.id} className="relative">
                    {content.type === 'image' ? (
                      <div
                        onClick={() => {
                          setSelectedContentId(content.id);
                        }}
                        className={`relative w-full cursor-pointer transition-all overflow-hidden ${selectedContentId === content.id ? 'ring-4 ring-cyan-400' : ''
                          }`}
                      >
                        {/* 조명 효과 레이어 */}
                        <div
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            background: `radial-gradient(ellipse at ${customization.lightingAngle}% 30%, rgba(255,255,255,${customization.lightingIntensity / 200}) 0%, transparent 70%)`,
                          }}
                        />

                        {/* 액자 + 이미지 */}
                        <div className="relative">
                          {/* 이미지 */}
                          <img
                            src={content.url}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-auto object-cover"
                            style={
                              customization.effect
                                ? {
                                  filter: `url(#${templates.find(t => t.id === customization.effect)?.svgFilter}) opacity(${customization.intensity}%)`,
                                  display: 'block',
                                }
                                : {
                                  display: 'block',
                                }
                            }
                          />

                          {/* 액자 오버레이 (이미지 위에 덮어씌움) */}
                          {customization.frame !== 'none' && (
                            <div
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                border: 'solid',
                                ...getFrameStyle(customization.frame),
                                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                              }}
                            />
                          )}
                        </div>

                        {/* 우측 상단 버튼들 */}
                        <div className="absolute top-4 right-4 flex gap-2 z-10">
                          {/* 삭제 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setContents(contents.filter(c => c.id !== content.id));
                              if (selectedContentId === content.id) {
                                setSelectedContentId(null);
                              }
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setSelectedContentId(content.id);
                          if (editingTextId !== content.id) {
                            setEditingTextId(content.id);
                          }
                        }}
                        className={`relative w-full p-8 rounded-2xl bg-white border-2 cursor-pointer transition-all ${selectedContentId === content.id ? 'border-cyan-400' : 'border-gray-200'
                          }`}
                      >
                        {editingTextId === content.id ? (
                          <textarea
                            value={content.text}
                            onChange={(e) => {
                              setContents(
                                contents.map(c =>
                                  c.id === content.id ? { ...c, text: e.target.value } : c
                                )
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => {
                              setTimeout(() => setEditingTextId(null), 100);
                            }}
                            autoFocus
                            className="w-full min-h-[150px] text-[18px] text-gray-800 leading-relaxed resize-none focus:outline-none"
                          />
                        ) : (
                          <p className="text-[18px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {content.text}
                          </p>
                        )}

                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContents(contents.filter(c => c.id !== content.id));
                            if (selectedContentId === content.id) {
                              setSelectedContentId(null);
                            }
                          }}
                          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 추가 업로드 안내 */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-[14px] text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors bg-white/50 backdrop-blur-sm"
              >
                + 작품 추가하기
              </button>

              {/* 현재 적용된 테마 표시 */}
              {selectedTemplate && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="rounded-full bg-black/60 px-6 py-3 text-[15px] text-white backdrop-blur-md">
                    현재 작품 테마: <span className="font-semibold">{templates.find(t => t.id === selectedTemplate)?.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 우측: 설정 사이드바 */}
      <div className="w-1/4 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        {/* 이미지/텍스트 추가 버튼 - 최상단으로 이동 */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-3">
            {imageTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedImageType(type.id);
                  if (type.id === 'image') {
                    fileInputRef.current?.click();
                  } else if (type.id === 'drawing') {
                    setShowDrawingImportModal(true);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-2 p-3 border-2 rounded-xl transition-colors ${selectedImageType === type.id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent">
                  <type.icon className="h-5 w-5 text-gray-700" />
                </div>
                <span className="text-[12px] font-medium text-gray-700 text-center leading-tight">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 제목 입력 - 이미지가 선택된 경우 */}
        {selectedContentId && contents.find(c => c.id === selectedContentId)?.type === 'image' && (() => {
          const selectedIndex = contents.findIndex(c => c.id === selectedContentId);
          const selectedContent = contents[selectedIndex];
          const customization = imageCustomizations[selectedContentId] || {
            frame: 'none',
            effect: null,
            intensity: 50,
            speed: 30,
            lightingAngle: 45,
            lightingIntensity: 70,
          };

          const updateCustomization = (updates: Partial<typeof customization>) => {
            setImageCustomizations({
              ...imageCustomizations,
              [selectedContentId]: { ...customization, ...updates },
            });
          };

          const frames = [
            { id: 'none', name: '액자 없음' },
            { id: 'modern', name: '모던 블랙' },
            { id: 'wood', name: '원목' },
            { id: 'gold', name: '골드' },
            { id: 'white', name: '화이트' },
          ];

          return (
            <div className="space-y-6">
              {/* 이미지 제목 입력 */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                  {selectedIndex + 1}번 이미지 제목 <span className="text-gray-500 font-normal text-[12px]">(선택사항)</span>
                </label>
                <input
                  type="text"
                  value={selectedContent.title || ''}
                  onChange={(e) => {
                    setContents(
                      contents.map(c =>
                        c.id === selectedContentId ? { ...c, title: e.target.value } : c
                      )
                    );
                  }}
                  placeholder="미입력 시 '무제'로 표시됩니다"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              {/* 작업자 입력 */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-900 mb-2">
                  작업자 <span className="text-gray-500 font-normal text-[12px]">(선택사항)</span>
                </label>
                <p className="text-[12px] text-gray-500 mb-2">
                  미입력 시 본인으로 표시됩니다.
                </p>

                {selectedContent.artist ? (
                  <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <img src={selectedContent.artist.avatar} alt={selectedContent.artist.name} className="h-8 w-8 rounded-full object-cover" />
                      <span className="text-[13px] font-medium text-gray-900">{selectedContent.artist.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setContents(
                          contents.map(c =>
                            c.id === selectedContentId ? { ...c, artist: undefined } : c
                          )
                        );
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={artistSearch}
                        onChange={(e) => setArtistSearch(e.target.value)}
                        placeholder="작가 이름으로 검색"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>

                    {artistSearch && (
                      <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto mt-2">
                        {artists
                          .filter(artist =>
                            artist.name.toLowerCase().includes(artistSearch.toLowerCase())
                          )
                          .slice(0, 5)
                          .map(artist => (
                            <button
                              key={artist.id}
                              onClick={() => {
                                setContents(
                                  contents.map(c =>
                                    c.id === selectedContentId ? {
                                      ...c,
                                      artist: {
                                        id: artist.id,
                                        name: artist.name,
                                        avatar: artist.avatar
                                      }
                                    } : c
                                  )
                                );
                                setArtistSearch('');
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                              <img src={artist.avatar} alt={artist.name} className="h-8 w-8 rounded-full object-cover" />
                              <div>
                                <div className="text-[13px] font-medium text-gray-900">{artist.name}</div>
                                <div className="text-[11px] text-gray-500">{artist.bio}</div>
                              </div>
                            </button>
                          ))
                        }
                        {artists.filter(artist =>
                          artist.name.toLowerCase().includes(artistSearch.toLowerCase())
                        ).length === 0 && (
                            <div className="px-4 py-3 text-[13px] text-gray-500 text-center">
                              검색 결과가 없습니다
                            </div>
                          )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 액자 선택 */}
              <div>
                <label className="block text-[14px] font-semibold text-gray-900 mb-3">액자 스타일</label>
                <div className="grid grid-cols-3 gap-2">
                  {frames.map(frame => (
                    <button
                      key={frame.id}
                      onClick={() => updateCustomization({ frame: frame.id })}
                      className={`py-2.5 px-3 rounded-lg text-[12px] font-medium transition-all ${customization.frame === frame.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {frame.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* 하단 액션 버튼 */}
        <div className="mt-auto pt-8 space-y-3">
          {/* 배경색상 설정 */}
          <div className="mb-6">
            <label className="block text-[14px] font-semibold text-gray-900 mb-2">
              배경색상 설정
            </label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                style={{ backgroundColor }}
                onClick={() => document.getElementById('bg-color-input')?.click()}
              />
              <input
                id="bg-color-input"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="hidden"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    setBackgroundColor(value);
                  }
                }}
                placeholder="#FFFFFF"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-[14px] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* 콘텐츠 간격 설정 */}
          <div className="mb-6">
            <label className="block text-[14px] font-semibold text-gray-900 mb-3">
              콘텐츠 간격 설정
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={contentSpacing}
                onChange={(e) => setContentSpacing(Number(e.target.value))}
                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${contentSpacing}%, #e5e7eb ${contentSpacing}%, #e5e7eb 100%)`
                }}
              />
              <div className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-[14px] text-center font-medium">
                {contentSpacing}px
              </div>
            </div>
          </div>

          {/* 세부 정보 설정 */}
          <div className="mb-6">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-50 border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Info className="h-5 w-5 text-green-600" />
              <span className="text-[14px] font-semibold text-green-700">세부 정보 설정</span>
            </button>
          </div>

          {/* 작품 소유권 확인 장치 */}
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="original-work-check"
                checked={isOriginalWork}
                onChange={(e) => setIsOriginalWork(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <label htmlFor="original-work-check" className="text-[13px] text-amber-900 leading-relaxed cursor-pointer select-none">
                <strong>본인이 직접 창작한 예술 작품</strong>임을 확인합니다. 단순 사진이나 스냅샷은 업로드가 제한될 수 있습니다.
              </label>
            </div>
          </div>

          <button
            disabled={contents.length === 0 || !isOriginalWork}
            onClick={() => {
              // 유효성 검사
              if (!title.trim()) {
                alert('작품명을 입력해주세요.');
                return;
              }

              if (contents.length === 0) {
                alert('최소 1개 이상의 이미지를 업로드해주세요.');
                return;
              }

              // 이미지만 필터링
              const imageContents = contents.filter(c => c.type === 'image' && c.url);

              // 새 작품 생성
              const newWork: Work = {
                id: generateRandomId(),
                title: title.trim(),
                artistId: artists[0].id, // 현재 로그인 사용자
                artist: artists[0],
                image: imageContents.map(c => c.url!),
                likes: 0,
                saves: 0,
                comments: 0,
                category: selectedCategories.length > 0 ? selectedCategories[0] as Work['category'] : 'art',
                tags: tags,
                description: `${title} - ${artists[0].name}의 작품`,
                saleStatus: 'none',
                isForSale: false,
              };

              // workStore에 추가
              const workId = workStore.addWork(newWork);

              // 성공 알림
              alert('✨ 작품이 성공적으로 게시되었습니다!');

              // 작품 상세 페이지로 이동
              navigate(`/work/${workId}`);
            }}
            className={`w-full py-3.5 rounded-full text-[15px] font-semibold transition-all ${contents.length > 0 && isOriginalWork
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            계속
          </button>

          <button
            disabled={contents.length === 0}
            onClick={() => {
              // 초안 저장
              if (!title.trim()) {
                alert('작품명을 입력해주세요.');
                return;
              }

              const draft = {
                id: generateRandomId(),
                title: title.trim(),
                contents: contents,
                tags: tags,
                categories: selectedCategories,
                imageCustomizations: imageCustomizations,
                savedAt: new Date().toISOString(),
              };

              draftStore.saveDraft(draft);
              alert('💾 초안으로 저장되었습니다!');

              // 프로필 페이지의 초안 탭으로 이동
              navigate('/profile');
            }}
            className={`w-full py-3.5 rounded-full text-[15px] font-semibold transition-all ${contents.length > 0 && isOriginalWork
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
          >
            초안으로 저장
          </button>

          <button
            disabled={contents.length === 0}
            onClick={() => {
              // 미리보기 기능 (간단하게 구현)
              if (contents.length === 0) return;

              alert('🔍 미리보기: 현재 ' + contents.length + '개의 이미지가 업로드되었습니다.\n전시명: ' + (title || '(미입력)'));
            }}
            className={`w-full py-2 text-[14px] transition-all ${contents.length > 0
              ? 'text-gray-700 hover:text-gray-900'
              : 'text-gray-300 cursor-not-allowed'
              }`}
          >
            미리보기 확인
          </button>
        </div>

      </div>
    </div>
  );
}

function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 11);
}